/**
 * Monopoly Bangladesh - Game Room JavaScript
 */

const urlParams = new URLSearchParams(window.location.search);
const gameId = parseInt(urlParams.get('id'));
const playerId = parseInt(urlParams.get('player'));

const gameState = {
  gameId,
  playerId,
  players: [],
  properties: [],
  currentPlayer: 0,
  ws: null,
  hasRolled: false
};

const board = document.getElementById('board');
const playersList = document.getElementById('playersList');
const propertyDetails = document.getElementById('propertyDetails');
const diceResult = document.getElementById('diceResult');
const btnRoll = document.getElementById('btnRoll');
const btnBuy = document.getElementById('btnBuy');
const btnEndTurn = document.getElementById('btnEndTurn');
const actionMessage = document.getElementById('actionMessage');
const currentPlayerName = document.getElementById('currentPlayerName');
const logEntries = document.getElementById('logEntries');
const loadingOverlay = document.getElementById('loadingOverlay');

const banglaNumerals = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };

function toBangla(num) {
  return num.toString().split('').map(d => banglaNumerals[d] || d).join('');
}

function formatCurrency(amount) {
  return '৳' + toBangla(amount);
}

function log(message) {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = `[${new Date().toLocaleTimeString('bn-BD')}] ${message}`;
  logEntries.insertBefore(entry, logEntries.firstChild);
  while (logEntries.children.length > 20) {logEntries.removeChild(logEntries.lastChild);}
}

function showLoading() { loadingOverlay.classList.add('active'); }
function hideLoading() { loadingOverlay.classList.remove('active'); }

function initWebSocket() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${location.host}`;
  
  gameState.ws = new WebSocket(wsUrl);
  
  gameState.ws.onopen = () => {
    log('Connected');
    gameState.ws.send(JSON.stringify({
      type: 'join_game',
      payload: { playerId, gameId }
    }));
  };
  
  gameState.ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleServerMessage(data);
  };
  
  gameState.ws.onclose = () => {
    log('Disconnected. Reconnecting...');
    setTimeout(initWebSocket, 3000);
  };
  
  gameState.ws.onerror = () => log('Connection error');
}

function handleServerMessage(data) {
  switch (data.type) {
    case 'game_joined':
      log('Joined game');
      updateGameState(data.payload.gameState);
      break;
    case 'game_state':
      updateGameState(data.payload);
      break;
    case 'dice_rolled':
      handleDiceRolled(data.payload);
      break;
    case 'property_bought':
      log(`Property bought!`);
      refreshGameState();
      break;
    case 'turn_changed':
      handleTurnChanged(data.payload);
      break;
    case 'player_joined':
      log('Player joined');
      refreshGameState();
      break;
  }
}

function updateGameState(state) {
  gameState.players = state.players || [];
  gameState.properties = state.properties || [];
  gameState.currentPlayer = state.currentPlayer || 0;
  
  renderPlayers();
  renderBoard();
  updateUI();
}

async function refreshGameState() {
  try {
    const res = await fetch(`/api/games/${gameId}`);
    const state = await res.json();
    updateGameState(state);
  } catch {
    log('Failed to refresh');
  }
}

function renderPlayers() {
  if (gameState.players.length === 0) {
    playersList.innerHTML = '<p>Waiting...</p>';
    return;
  }
  
  playersList.innerHTML = gameState.players.map((player, index) => {
    const isCurrent = index === gameState.currentPlayer;
    const isMe = player.id === playerId;
    return `
      <div class="player-card ${isCurrent ? 'current' : ''}">
        <div class="player-name">${player.name}${isMe ? ' (You)' : ''}</div>
        <div class="player-money">${formatCurrency(player.money)}</div>
        <div class="player-position">Pos: ${player.position}</div>
      </div>
    `;
  }).join('');
}

function renderBoard() {
  const spaces = getBoardSpaces();
  
  board.innerHTML = spaces.map(space => {
    const gridPos = getGridPosition(space.index);
    const playersHere = gameState.players.filter(p => p.position === space.index);
    
    return `
      <div class="space ${space.type} ${space.color || ''}"
           style="grid-column: ${gridPos.col}; grid-row: ${gridPos.row};"
           onclick="window.selectSpace(${space.index})">
        ${space.color ? `<div class="color-bar" style="background:var(--color-${space.color})"></div>` : ''}
        <div class="space-name">${space.name_bn}</div>
        ${space.price ? `<div class="space-price">${formatCurrency(space.price)}</div>` : ''}
        <div class="player-tokens">
          ${playersHere.map(() => '<span class="player-token"></span>').join('')}
        </div>
      </div>
    `;
  }).join('');
}

function getBoardSpaces() {
  return [
    { index: 0, name_bn: 'শুরু', type: 'corner' },
    { index: 1, name_bn: 'কুরিল বস্তি', type: 'property', color: 'brown', price: 600 },
    { index: 2, name_bn: 'কমিউনিটি ফান্ড', type: 'community' },
    { index: 3, name_bn: 'করাইল বস্তি', type: 'property', color: 'brown', price: 600 },
    { index: 4, name_bn: 'আয়কর', type: 'tax', price: 2000 },
    { index: 5, name_bn: 'কমলাপুর', type: 'railroad', price: 2000 },
    { index: 6, name_bn: 'মিরপুর', type: 'property', color: 'lightblue', price: 1000 },
    { index: 7, name_bn: 'সুযোগ', type: 'chance' },
    { index: 8, name_bn: 'মোহাম্মদপুর', type: 'property', color: 'lightblue', price: 1000 },
    { index: 9, name_bn: 'উত্তরা', type: 'property', color: 'lightblue', price: 1200 },
    { index: 10, name_bn: 'কারাগার', type: 'corner' },
    { index: 11, name_bn: 'তেজগাঁও', type: 'property', color: 'pink', price: 1400 },
    { index: 12, name_bn: 'ডেসকো', type: 'utility', price: 1500 },
    { index: 13, name_bn: 'খিলগাঁও', type: 'property', color: 'pink', price: 1400 },
    { index: 14, name_bn: 'মগবাজার', type: 'property', color: 'pink', price: 1600 },
    { index: 15, name_bn: 'বিমানবন্দর', type: 'railroad', price: 2000 },
    { index: 16, name_bn: 'মালিবাগ', type: 'property', color: 'orange', price: 1800 },
    { index: 17, name_bn: 'কমিউনিটি ফান্ড', type: 'community' },
    { index: 18, name_bn: 'রামপুরা', type: 'property', color: 'orange', price: 1800 },
    { index: 19, name_bn: 'বাসা বো', type: 'property', color: 'orange', price: 2000 },
    { index: 20, name_bn: 'বিনামূল্যে পার্কিং', type: 'corner' },
    { index: 21, name_bn: 'ধানমন্ডি', type: 'property', color: 'red', price: 2200 },
    { index: 22, name_bn: 'সুযোগ', type: 'chance' },
    { index: 23, name_bn: 'গ্রিন রোড', type: 'property', color: 'red', price: 2200 },
    { index: 24, name_bn: 'এলিফ্যান্ট রোড', type: 'property', color: 'red', price: 2400 },
    { index: 25, name_bn: 'আখতারুজ্জামান', type: 'railroad', price: 2000 },
    { index: 26, name_bn: 'কলাবাগান', type: 'property', color: 'yellow', price: 2600 },
    { index: 27, name_bn: 'নিউ মার্কেট', type: 'property', color: 'yellow', price: 2600 },
    { index: 28, name_bn: 'ওয়াসা', type: 'utility', price: 1500 },
    { index: 29, name_bn: 'পল্টন', type: 'property', color: 'yellow', price: 2800 },
    { index: 30, name_bn: 'কারাগারে যান', type: 'corner' },
    { index: 31, name_bn: 'শাহবাগ', type: 'property', color: 'green', price: 3000 },
    { index: 32, name_bn: 'কারওয়ান বাজার', type: 'property', color: 'green', price: 3000 },
    { index: 33, name_bn: 'কমিউনিটি ফান্ড', type: 'community' },
    { index: 34, name_bn: 'গুলশান-১', type: 'property', color: 'green', price: 3200 },
    { index: 35, name_bn: 'হাজীপুর', type: 'railroad', price: 2000 },
    { index: 36, name_bn: 'সুযোগ', type: 'chance' },
    { index: 37, name_bn: 'বনানী', type: 'property', color: 'darkblue', price: 3500 },
    { index: 38, name_bn: 'বিলাসিতা কর', type: 'tax', price: 1000 },
    { index: 39, name_bn: 'বসুন্ধরা', type: 'property', color: 'darkblue', price: 4000 }
  ];
}

function getGridPosition(index) {
  if (index >= 0 && index <= 10) {return { row: 11, col: 11 - index };}
  if (index >= 11 && index <= 20) {return { row: 11 - (index - 10), col: 1 };}
  if (index >= 21 && index <= 30) {return { row: 1, col: index - 19 };}
  if (index >= 31 && index <= 39) {return { row: index - 29, col: 11 };}
  return { row: 11, col: 11 };
}

window.selectSpace = function(index) {
  const spaces = getBoardSpaces();
  const space = spaces.find(s => s.index === index);
  if (!space) {return;}
  
  const ownedBy = gameState.properties.find(p => p.space_number === index);
  
  propertyDetails.innerHTML = `
    <div class="property-card">
      <div class="property-name">${space.name_bn}</div>
      ${space.price ? `<div class="property-price">${formatCurrency(space.price)}</div>` : ''}
      ${ownedBy ? `<div class="property-mortgage">Owned</div>` : ''}
    </div>
  `;
};

function updateUI() {
  const myPlayer = gameState.players.find(p => p.id === playerId);
  const isMyTurn = gameState.players.indexOf(myPlayer) === gameState.currentPlayer;
  
  currentPlayerName.textContent = gameState.players[gameState.currentPlayer]?.name || '-';
  
  if (!isMyTurn) {
    btnRoll.disabled = true;
    btnBuy.disabled = true;
    btnEndTurn.disabled = true;
    actionMessage.textContent = `Waiting for ${gameState.players[gameState.currentPlayer]?.name}...`;
    return;
  }
  
  if (!gameState.hasRolled) {
    btnRoll.disabled = false;
    btnBuy.disabled = true;
    btnEndTurn.disabled = true;
    actionMessage.textContent = 'Roll the dice!';
  } else {
    btnRoll.disabled = true;
    const myPos = myPlayer?.position;
    const space = getBoardSpaces().find(s => s.index === myPos);
    const canBuy = space && space.type === 'property' && space.price && 
                   !gameState.properties.find(p => p.space_number === myPos);
    btnBuy.disabled = !canBuy || (myPlayer.money < (space?.price || 0));
    btnEndTurn.disabled = false;
    actionMessage.textContent = 'Buy or End Turn';
  }
}

function rollDice() {
  if (gameState.ws?.readyState === WebSocket.OPEN) {
    gameState.ws.send(JSON.stringify({ type: 'roll_dice' }));
  }
}

function handleDiceRolled(result) {
  const die1 = document.getElementById('die1');
  const die2 = document.getElementById('die2');
  
  die1.classList.add('rolling');
  die2.classList.add('rolling');
  
  setTimeout(() => {
    die1.classList.remove('rolling');
    die2.classList.remove('rolling');
    const diceChars = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    die1.textContent = diceChars[result.die1 - 1];
    die2.textContent = diceChars[result.die2 - 1];
    diceResult.textContent = `Total: ${toBangla(result.total)}${result.isDoubles ? ' (DOUBLES!)' : ''}`;
    
    gameState.hasRolled = true;
    updateUI();
    refreshGameState();
    log(`Rolled ${result.die1}+${result.die2}=${result.total}`);
  }, 500);
}

function buyProperty() {
  const myPlayer = gameState.players.find(p => p.id === playerId);
  if (gameState.ws?.readyState === WebSocket.OPEN) {
    gameState.ws.send(JSON.stringify({
      type: 'buy_property',
      payload: { spaceIndex: myPlayer?.position }
    }));
  }
}

function endTurn() {
  if (gameState.ws?.readyState === WebSocket.OPEN) {
    gameState.ws.send(JSON.stringify({ type: 'end_turn' }));
  }
}

function handleTurnChanged(payload) {
  gameState.currentPlayer = payload.currentPlayer;
  gameState.hasRolled = false;
  diceResult.textContent = '';
  refreshGameState();
  log(`Turn: ${gameState.players[gameState.currentPlayer]?.name}`);
}

btnRoll.addEventListener('click', rollDice);
btnBuy.addEventListener('click', buyProperty);
btnEndTurn.addEventListener('click', endTurn);

document.getElementById('btnLeave').addEventListener('click', () => {
  if (confirm('Leave game?')) {
    window.location.href = '/lobby.html';
  }
});

async function init() {
  if (!gameId || !playerId) {
    alert('Missing game/player ID');
    window.location.href = '/lobby.html';
    return;
  }
  
  showLoading();
  initWebSocket();
  await refreshGameState();
  hideLoading();
  log('Game loaded');
}

init();
