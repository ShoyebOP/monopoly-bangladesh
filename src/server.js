import express from 'express';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDatabase, saveDatabase, closeDatabase, getDatabase } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(join(rootDir, 'public')));

// Initialize database on startup
let wss = null;

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
  });

  // Initialize WebSocket server
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        handleWebSocketMessage(ws, data);
      } catch {
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected');
    });
    
    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    shutdown(server);
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    shutdown(server);
  });
}

function shutdown(server) {
  if (wss) {
    wss.clients.forEach((client) => {
      client.close();
    });
    wss.close();
  }
  
  server.close(() => {
    console.log('Server closed');
    saveDatabase();
    closeDatabase();
    console.log('Database saved and closed');
    process.exit(0);
  });
}

function handleWebSocketMessage(ws, data) {
  const { type } = data;

  switch (type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;

    case 'get_game_state':
      // Send current game state
      const gameState = getGameState();
      ws.send(JSON.stringify({ type: 'game_state', payload: gameState }));
      break;

    case 'roll_dice':
      // Handle dice roll
      const diceResult = rollDice();
      broadcast({ type: 'dice_rolled', payload: diceResult });
      break;

    default:
      ws.send(JSON.stringify({ error: 'Unknown message type' }));
  }
}

function broadcast(message) {
  if (wss) {
    const messageStr = JSON.stringify(message);
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(messageStr);
      }
    });
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API: Get all players
app.get('/api/players', (req, res) => {
  try {
    const db = getDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' });
    }
    
    const results = db.exec('SELECT id, name, created_at FROM players ORDER BY name');
    const players = results.length > 0 ? results[0].values.map(row => ({
      id: row[0],
      name: row[1],
      created_at: row[2]
    })) : [];
    
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Create player
app.post('/api/players', (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Player name is required' });
    }
    
    const db = getDatabase();
    db.run('INSERT INTO players (name) VALUES (?)', [name]);
    saveDatabase();
    
    const result = db.exec('SELECT last_insert_rowid() as id');
    const playerId = result[0].values[0][0];
    
    res.status(201).json({ id: playerId, name });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Player already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// API: Delete player
app.delete('/api/players/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const result = db.run('DELETE FROM players WHERE id = ?', [id]);
    saveDatabase();
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json({ message: 'Player deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get all games
app.get('/api/games', (req, res) => {
  try {
    const db = getDatabase();
    const results = db.exec('SELECT id, name, status, created_at FROM games ORDER BY created_at DESC');
    const games = results.length > 0 ? results[0].values.map(row => ({
      id: row[0],
      name: row[1],
      status: row[2],
      created_at: row[3]
    })) : [];
    
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Create game
app.post('/api/games', (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Game name is required' });
    }
    
    const db = getDatabase();
    db.run('INSERT INTO games (name, status) VALUES (?, ?)', [name, 'waiting']);
    saveDatabase();
    
    const result = db.exec('SELECT last_insert_rowid() as id');
    const gameId = result[0].values[0][0];
    
    res.status(201).json({ id: gameId, name, status: 'waiting' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get game state
app.get('/api/games/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const results = db.exec('SELECT id, name, status, state_json, created_at FROM games WHERE id = ?', [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const row = results[0].values[0];
    res.json({
      id: row[0],
      name: row[1],
      status: row[2],
      state: row[3] ? JSON.parse(row[3]) : null,
      created_at: row[4]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Update game state
app.put('/api/games/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { state } = req.body;
    
    const db = getDatabase();
    db.run(
      'UPDATE games SET state_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [JSON.stringify(state), id]
    );
    saveDatabase();
    
    // Broadcast update to connected clients
    broadcast({ type: 'game_updated', payload: { gameId: id, state } });
    
    res.json({ message: 'Game state updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Get all properties
app.get('/api/properties', (req, res) => {
  try {
    const db = getDatabase();
    const results = db.exec('SELECT * FROM properties ORDER BY space_number');

    // Format results
    const props = [];
    if (results.length > 0) {
      const cols = results[0].columns;
      for (const row of results[0].values) {
        const prop = {};
        cols.forEach((col, i) => {
          prop[col] = row[i];
        });
        props.push(prop);
      }
    }

    res.json(props);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to get game state
function getGameState() {
  // Placeholder - will be implemented with game logic module
  return {
    players: [],
    currentPlayer: null,
    board: {
      spaces: 40
    }
  };
}

// Helper function to roll dice
function rollDice() {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  return {
    die1,
    die2,
    total: die1 + die2,
    isDoubles: die1 === die2
  };
}

// Start the server
startServer().catch(console.error);
