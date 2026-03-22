import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDatabase, saveDatabase, closeDatabase, getDatabase } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(join(rootDir, 'public')));

let wss = null;
const connectedClients = new Map();
const activeGames = new Map();

async function startServer() {
  try {
    await initDatabase();
    console.log('Database initialized');
  } catch {
    console.error('Failed to initialize database');
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`Monopoly Bangladesh server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
  });

  wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws) => {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`Client connected: ${clientId}`);
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        handleWebSocketMessage(ws, clientId, data);
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });
    
    ws.on('close', () => {
      console.log(`Client disconnected: ${clientId}`);
      connectedClients.delete(clientId);
    });
    
    ws.on('error', (err) => {
      console.error(`WebSocket error for ${clientId}:`, err);
    });
    
    ws.send(JSON.stringify({ type: 'client_id', clientId }));
  });

  process.on('SIGTERM', () => shutdown(server));
  process.on('SIGINT', () => shutdown(server));
}

function shutdown(server) {
  console.log('Shutting down server...');
  if (wss) {
    wss.clients.forEach((client) => client.close());
    wss.close();
  }
  server.close(() => {
    saveDatabase();
    closeDatabase();
    console.log('Server stopped');
    process.exit(0);
  });
}

function handleWebSocketMessage(ws, clientId, data) {
  const { type, payload } = data;
  
  switch (type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    case 'join_game':
      handleJoinGame(ws, clientId, payload);
      break;
    case 'roll_dice':
      handleRollDice(ws, clientId);
      break;
    case 'buy_property':
      handleBuyProperty(ws, clientId, payload);
      break;
    case 'end_turn':
      handleEndTurn(ws, clientId);
      break;
    case 'get_game_state':
      handleGetGameState(ws, clientId);
      break;
    default:
      ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
  }
}

function handleJoinGame(ws, clientId, { playerId, gameId }) {
  const db = getDatabase();
  if (!db) {
    ws.send(JSON.stringify({ type: 'error', message: 'Database not available' }));
    return;
  }
  
  connectedClients.set(clientId, { playerId, gameId });
  
  // Initialize active game if not exists
  if (!activeGames.has(gameId)) {
    const playersResult = db.exec(`SELECT player_id FROM game_players WHERE game_id = ${gameId}`);
    if (playersResult.length > 0) {
      const playerIds = playersResult[0].values.map(row => row[0]);
      activeGames.set(gameId, { players: playerIds, currentPlayer: 0 });
    }
  }
  
  const gameState = getFullGameState(gameId);
  
  ws.send(JSON.stringify({ 
    type: 'game_joined', 
    payload: { success: true, playerId, gameId, gameState }
  }));
  
  broadcastToGame(gameId, { type: 'player_joined', payload: { playerId } }, clientId);
}

function handleRollDice(ws, clientId) {
  const client = connectedClients.get(clientId);
  if (!client) {
    ws.send(JSON.stringify({ type: 'error', message: 'Not in a game' }));
    return;
  }
  
  const { gameId, playerId } = client;
  const game = activeGames.get(gameId);
  
  if (!game) {
    ws.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
    return;
  }
  
  // Check if it's this player's turn
  const currentPlayerId = game.players[game.currentPlayer];
  if (currentPlayerId !== playerId) {
    ws.send(JSON.stringify({ type: 'error', message: 'Not your turn' }));
    return;
  }
  
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const total = die1 + die2;
  const isDoubles = die1 === die2;
  
  const result = { die1, die2, total, isDoubles };
  
  // Move player
  const db = getDatabase();
  const playerResult = db.exec(`SELECT position FROM game_players WHERE game_id = ${gameId} AND player_id = ${playerId}`);
  if (playerResult.length > 0) {
    const oldPos = playerResult[0].values[0][0];
    let newPos = (oldPos + total) % 40;
    
    // Handle Go passing
    if (newPos < oldPos) {
      db.run(`UPDATE game_players SET money = money + 2000 WHERE game_id = ${gameId} AND player_id = ${playerId}`);
    }
    
    // Handle Go To Jail
    if (newPos === 30) {
      newPos = 10;
    }
    
    db.run(`UPDATE game_players SET position = ${newPos} WHERE game_id = ${gameId} AND player_id = ${playerId}`);
    saveDatabase();
  }
  
  broadcastToGame(gameId, { type: 'dice_rolled', payload: result });
}

function handleBuyProperty(ws, clientId, { spaceIndex }) {
  const client = connectedClients.get(clientId);
  if (!client) {return;}
  
  const { playerId, gameId } = client;
  const db = getDatabase();
  
  const propResult = db.exec(`SELECT * FROM properties WHERE space_number = ${spaceIndex}`);
  if (propResult.length === 0) {
    ws.send(JSON.stringify({ type: 'error', message: 'Property not found' }));
    return;
  }
  
  const prop = propertyFromRow(propResult[0]);
  
  const playerResult = db.exec(`SELECT money FROM game_players WHERE game_id = ${gameId} AND player_id = ${playerId}`);
  if (playerResult.length === 0) {return;}
  
  const playerMoney = playerResult[0].values[0][0];
  if (playerMoney < prop.price) {
    ws.send(JSON.stringify({ type: 'error', message: 'Not enough money' }));
    return;
  }
  
  // Check if already owned
  const existingResult = db.exec(`SELECT owner_player_id FROM game_properties WHERE game_id = ${gameId} AND property_id = ${prop.id}`);
  if (existingResult.length > 0 && existingResult[0].values[0][0] !== null) {
    ws.send(JSON.stringify({ type: 'error', message: 'Property already owned' }));
    return;
  }
  
  db.run(`UPDATE game_players SET money = money - ${prop.price} WHERE game_id = ${gameId} AND player_id = ${playerId}`);
  db.run(`INSERT OR REPLACE INTO game_properties (game_id, property_id, owner_player_id) VALUES (${gameId}, ${prop.id}, ${playerId})`);
  saveDatabase();
  
  broadcastToGame(gameId, {
    type: 'property_bought',
    payload: { playerId, spaceIndex, property: prop }
  });
}

function handleEndTurn(ws, clientId) {
  const client = connectedClients.get(clientId);
  if (!client) {return;}
  
  const { gameId, playerId } = client;
  const game = activeGames.get(gameId);
  
  if (!game) {return;}
  
  // Check if it's this player's turn
  const currentPlayerId = game.players[game.currentPlayer];
  if (currentPlayerId !== playerId) {
    ws.send(JSON.stringify({ type: 'error', message: 'Not your turn' }));
    return;
  }
  
  game.currentPlayer = (game.currentPlayer + 1) % game.players.length;
  
  broadcastToGame(gameId, {
    type: 'turn_changed',
    payload: { currentPlayer: game.currentPlayer }
  });
}

function handleGetGameState(ws, clientId) {
  const client = connectedClients.get(clientId);
  if (!client) {
    ws.send(JSON.stringify({ type: 'game_state', payload: { players: [], properties: [] } }));
    return;
  }
  
  const { gameId } = client;
  const gameState = getFullGameState(gameId);
  ws.send(JSON.stringify({ type: 'game_state', payload: gameState }));
}

function getFullGameState(gameId) {
  const db = getDatabase();
  if (!db) {return { players: [], properties: [] };}

  console.log(`Getting game state for gameId: ${gameId}`);
  
  // Debug: Check game_players table
  const debugResult = db.exec(`SELECT * FROM game_players WHERE game_id = ${gameId}`);
  console.log(`game_players for game ${gameId}:`, debugResult);

  const playersResult = db.exec(`
    SELECT gp.player_id, p.name, gp.money, gp.position, COALESCE(gp.is_bankrupt, 0) as is_bankrupt
    FROM game_players gp
    JOIN players p ON gp.player_id = p.id
    WHERE gp.game_id = ${gameId}
  `);

  console.log(`playersResult:`, playersResult);

  const players = playersResult.length > 0 ? playersResult[0].values.map(row => ({
    id: row[0], name: row[1], money: row[2], position: row[3], is_bankrupt: row[4]
  })) : [];
  
  console.log(`Parsed players:`, players);

  const propsResult = db.exec(`
    SELECT gp.property_id, COALESCE(gp.owner_player_id, 0) as owner_player_id, p.name_en, p.name_bn, p.price, p.rent_base, p.rent_1, p.rent_2, p.rent_3, p.rent_4, p.rent_hotel, p.house_cost, p.color_group, p.space_number
    FROM game_properties gp
    JOIN properties p ON gp.property_id = p.id
    WHERE gp.game_id = ${gameId}
  `);

  const properties = propsResult.length > 0 ? propsResult[0].values.map(row => ({
    property_id: row[0], owner_id: row[1], name_en: row[2], name_bn: row[3],
    price: row[4], rent_base: row[5], rent_1: row[6], rent_2: row[7],
    rent_3: row[8], rent_4: row[9], rent_hotel: row[10], house_cost: row[11],
    color: row[12], space_number: row[13]
  })) : [];

  const game = activeGames.get(gameId);

  return {
    gameId,
    players,
    properties,
    currentPlayer: game ? game.currentPlayer : 0,
    status: 'playing'
  };
}

function propertyFromRow(row) {
  return {
    id: row[0], space_number: row[1], name_en: row[2], name_bn: row[3], type: row[4],
    price: row[5], rent_base: row[6], rent_1: row[7], rent_2: row[8], rent_3: row[9],
    rent_4: row[10], rent_hotel: row[11], house_cost: row[12], color: row[13]
  };
}

function broadcastToGame(gameId, message, excludeClientId = null) {
  if (!wss) {return;}
  const messageStr = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const clientEntry = [...connectedClients.entries()].find(([_, data]) => data && data.gameId === gameId);
      if (clientEntry && clientEntry[0] !== excludeClientId) {
        client.send(messageStr);
      }
    }
  });
}

// API Routes
app.get('/api/players', (req, res) => {
  try {
    const db = getDatabase();
    if (!db) {return res.status(500).json({ error: 'Database not initialized' });}
    const results = db.exec('SELECT id, name, created_at FROM players ORDER BY name');
    const players = results.length > 0 ? results[0].values.map(row => ({ id: row[0], name: row[1], created_at: row[2] })) : [];
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/players', (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {return res.status(400).json({ error: 'Player name is required' });}
    const db = getDatabase();
    db.run('INSERT INTO players (name) VALUES (?)', [name]);
    saveDatabase();
    const result = db.exec('SELECT last_insert_rowid() as id');
    res.status(201).json({ id: result[0].values[0][0], name });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Player already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/players/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    const result = db.run('DELETE FROM players WHERE id = ?', [id]);
    saveDatabase();
    if (result.changes === 0) {return res.status(404).json({ error: 'Player not found' });}
    res.json({ message: 'Player deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/games', (req, res) => {
  try {
    const db = getDatabase();
    const results = db.exec('SELECT id, name, status, created_at FROM games ORDER BY created_at DESC');
    const games = results.length > 0 ? results[0].values.map(row => ({ id: row[0], name: row[1], status: row[2], created_at: row[3] })) : [];
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/games', (req, res) => {
  try {
    const { name, playerIds } = req.body;
    if (!name) {return res.status(400).json({ error: 'Game name is required' });}
    const db = getDatabase();
    db.run('INSERT INTO games (name, status) VALUES (?, ?)', [name, 'waiting']);
    saveDatabase();
    const result = db.exec('SELECT last_insert_rowid() as id');
    const gameId = result[0].values[0][0];
    
    if (playerIds && playerIds.length > 0) {
      playerIds.forEach((playerId) => {
        db.run('INSERT INTO game_players (game_id, player_id, money, position) VALUES (?, ?, 15000, 0)', [gameId, playerId]);
      });
      saveDatabase();
      activeGames.set(gameId, { players: playerIds, currentPlayer: 0 });
      // Update game status
      db.run(`UPDATE games SET status = 'playing' WHERE id = ${gameId}`);
      saveDatabase();
    }
    
    res.status(201).json({ id: gameId, name, status: 'playing', playerIds });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/games/:id', (req, res) => {
  try {
    const { id } = req.params;
    const gameState = getFullGameState(parseInt(id));
    res.json(gameState);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/properties', (req, res) => {
  try {
    const db = getDatabase();
    const results = db.exec('SELECT * FROM properties ORDER BY space_number');
    const props = [];
    if (results.length > 0) {
      const cols = results[0].columns;
      for (const row of results[0].values) {
        const prop = {};
        cols.forEach((col, i) => { prop[col] = row[i]; });
        props.push(prop);
      }
    }
    res.json(props);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

startServer().catch(console.error);
