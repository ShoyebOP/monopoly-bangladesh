/**
 * Monopoly Bangladesh - Game Client
 * Vanilla JavaScript for lightweight mobile performance
 * eslint-env browser
 */

// Game State
const gameState = {
  players: [],
  currentPlayer: null,
  properties: [],
  game: null,
  ws: null
};

// Bangla numerals mapping
const banglaNumerals = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
};

/**
 * Convert Arabic numerals to Bangla numerals
 */
function toBanglaNumerals(num) {
  return num.toString().split('').map(digit => 
    banglaNumerals[digit] || digit
  ).join('');
}

/**
 * Format currency with Bangla numeral
 */
function formatCurrency(amount) {
  return '৳' + toBanglaNumerals(amount);
}

/**
 * Initialize WebSocket connection
 */
function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  
  gameState.ws = new WebSocket(wsUrl);
  
  gameState.ws.onopen = () => {
    logMessage('সার্ভারের সাথে সংযোগ স্থাপিত হয়েছে');
    hideLoading();
    // Request initial game state
    sendMessage({ type: 'get_game_state' });
  };
  
  gameState.ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleServerMessage(data);
    } catch (err) {
      console.error('Failed to parse message:', err);
    }
  };
  
  gameState.ws.onclose = () => {
    logMessage('সার্ভারের সাথে সংযোগ বিচ্ছিন্ন হয়েছে। পুনরায় সংযোগ করা হচ্ছে...');
    setTimeout(initWebSocket, 3000);
  };
  
  gameState.ws.onerror = (err) => {
    console.error('WebSocket error:', err);
    logMessage('সংযোগে সমস্যা হচ্ছে');
  };
}

/**
 * Handle messages from server
 */
function handleServerMessage(data) {
  switch (data.type) {
    case 'pong':
      // Heartbeat response
      break;
    
    case 'game_state':
      updateGameState(data.payload);
      break;
    
    case 'dice_rolled':
      handleDiceRoll(data.payload);
      break;
    
    case 'game_updated':
      refreshGameState();
      break;
    
    default:
      console.log('Unknown message type:', data.type);
  }
}

/**
 * Send message to server
 */
function sendMessage(message) {
  if (gameState.ws && gameState.ws.readyState === WebSocket.OPEN) {
    gameState.ws.send(JSON.stringify(message));
  }
}

/**
 * Update game state from server
 */
function updateGameState(state) {
  gameState.players = state.players || [];
  gameState.currentPlayer = state.currentPlayer;
  gameState.properties = state.properties || [];
  gameState.game = state.game;
  
  renderPlayers();
  renderBoard();
  updateTurnIndicator();
}

/**
 * Refresh game state from server
 */
async function refreshGameState() {
  showLoading();
  try {
    const [playersRes, propertiesRes] = await Promise.all([
      fetch('/api/players'),
      fetch('/api/properties')
    ]);
    
    gameState.players = await playersRes.json();
    gameState.properties = await propertiesRes.json();
    
    renderPlayers();
    renderBoard();
  } catch (err) {
    console.error('Failed to refresh game state:', err);
    logMessage('খেলা তথ্য লোড করতে সমস্যা হচ্ছে');
  } finally {
    hideLoading();
  }
}

/**
 * Render players list
 */
function renderPlayers() {
  const container = document.getElementById('playersList');
  
  if (gameState.players.length === 0) {
    container.innerHTML = '<p class="empty-state">কোনো খেলোয়াড় নেই</p>';
    return;
  }
  
  container.innerHTML = gameState.players.map(player => `
    <div class="player-card">
      <div class="player-name">${player.name}</div>
      <div class="player-money">${formatCurrency(player.money || 1500)}</div>
      <div class="player-properties">সম্পত্তি: ${player.properties?.length || 0}</div>
    </div>
  `).join('');
}

/**
 * Render game board
 */
function renderBoard() {
  const board = document.getElementById('board');
  
  // Board layout: 40 spaces in a square
  // Top row: spaces 0-10 (right to left)
  // Right column: spaces 10-20 (top to bottom)
  // Bottom row: spaces 20-30 (left to right)
  // Left column: spaces 30-40 (bottom to top)
  
  const spaces = generateBoardSpaces();
  
  board.innerHTML = spaces.map((space, index) => {
    const gridPos = getGridPosition(index);
    const property = gameState.properties.find(p => p.space_number === index);
    
    return `
      <div class="space ${space.type} ${space.color || ''}" 
           style="grid-column: ${gridPos.col}; grid-row: ${gridPos.row};"
           onclick="selectSpace(${index})">
        ${space.color ? `<div class="color-bar" style="background-color: var(--color-${space.color})"></div>` : ''}
        <div class="space-name">${property?.name_bn || space.name}</div>
        ${space.price ? `<div class="space-price">${formatCurrency(space.price)}</div>` : ''}
        <div class="player-tokens" id="tokens-${index}"></div>
      </div>
    `;
  }).join('');
}

/**
 * Generate board spaces data
 */
function generateBoardSpaces() {
  const spaces = [
    { index: 0, name: 'শুরু (Go)', type: 'corner' },
    { index: 1, name: '', type: 'property', color: 'brown' },
    { index: 2, name: 'কুরিল বস্তি', type: 'property', color: 'brown', price: 60 },
    { index: 3, name: 'আয়কর', type: 'tax' },
    { index: 4, name: 'করাইল বস্তি', type: 'property', color: 'brown', price: 60 },
    { index: 5, name: 'কমলাপুর রেলওয়ে', type: 'railroad', price: 200 },
    { index: 6, name: '', type: 'property', color: 'lightblue' },
    { index: 7, name: 'মিরপুর', type: 'property', color: 'lightblue', price: 100 },
    { index: 8, name: 'সুযোগ', type: 'chance' },
    { index: 9, name: 'মোহাম্মদপুর', type: 'property', color: 'lightblue', price: 100 },
    { index: 10, name: 'উত্তরা', type: 'property', color: 'lightblue', price: 120 },
    { index: 11, name: 'কারাগার', type: 'corner' },
    { index: 12, name: '', type: 'property', color: 'pink' },
    { index: 13, name: 'তেজগাঁও', type: 'property', color: 'pink', price: 140 },
    { index: 14, name: 'ডেসকো', type: 'utility', price: 150 },
    { index: 15, name: 'খিলগাঁও', type: 'property', color: 'pink', price: 140 },
    { index: 16, name: 'বিমানবন্দর রেলওয়ে', type: 'railroad', price: 200 },
    { index: 17, name: 'মগবাজার', type: 'property', color: 'pink', price: 160 },
    { index: 18, name: 'কমিউনিটি ফান্ড', type: 'community' },
    { index: 19, name: 'মালিবাগ', type: 'property', color: 'orange', price: 180 },
    { index: 20, name: 'রামপুরা', type: 'property', color: 'orange', price: 180 },
    { index: 21, name: 'বিনামূল্যে পার্কিং', type: 'corner' },
    { index: 22, name: 'বাসা বো', type: 'property', color: 'orange', price: 200 },
    { index: 23, name: 'সুযোগ', type: 'chance' },
    { index: 24, name: '', type: 'property', color: 'red' },
    { index: 25, name: 'ধানমন্ডি', type: 'property', color: 'red', price: 220 },
    { index: 26, name: 'গ্রিন রোড', type: 'property', color: 'red', price: 220 },
    { index: 27, name: 'আখতারুজ্জামান রেলওয়ে', type: 'railroad', price: 200 },
    { index: 28, name: '', type: 'property', color: 'red' },
    { index: 29, name: 'এলিফ্যান্ট রোড', type: 'property', color: 'red', price: 240 },
    { index: 30, name: 'কারাগারে যান', type: 'corner' },
    { index: 31, name: '', type: 'property', color: 'yellow' },
    { index: 32, name: 'কলাবাগান', type: 'property', color: 'yellow', price: 260 },
    { index: 33, name: 'নিউ মার্কেট', type: 'property', color: 'yellow', price: 260 },
    { index: 34, name: 'কমিউনিটি ফান্ড', type: 'community' },
    { index: 35, name: 'পল্টন', type: 'property', color: 'yellow', price: 280 },
    { index: 36, name: 'হাজীপুর রেলওয়ে', type: 'railroad', price: 200 },
    { index: 37, name: 'সুযোগ', type: 'chance' },
    { index: 38, name: 'শাহবাগ', type: 'property', color: 'green', price: 300 },
    { index: 39, name: 'বসুন্ধরা', type: 'property', color: 'darkblue', price: 400 }
  ];
  
  return spaces;
}

/**
 * Get grid position for a space index
 * Standard Monopoly board layout:
 * - Go is at bottom-right (space 0)
 * - Bottom row: 0-10 (right to left)
 * - Left column: 10-20 (bottom to top)
 * - Top row: 20-30 (left to right)
 * - Right column: 30-40 (top to bottom)
 */
function getGridPosition(index) {
  // Board is 11x11 grid
  // Bottom row (Go corner): spaces 0-10, row 11, cols 11-1
  // Left column: spaces 10-20, rows 11-1, col 1
  // Top row: spaces 20-30, row 1, cols 1-11
  // Right column: spaces 30-40, rows 1-11, col 11
  
  if (index >= 0 && index <= 10) {
    // Bottom row (right to left, Go is at bottom-right)
    return { row: 11, col: 11 - index };
  } else if (index >= 11 && index <= 20) {
    // Left column (bottom to top)
    return { row: 11 - (index - 10), col: 1 };
  } else if (index >= 21 && index <= 30) {
    // Top row (left to right)
    return { row: 1, col: index - 19 };
  } else if (index >= 31 && index <= 39) {
    // Right column (top to bottom)
    return { row: index - 29, col: 11 };
  }
  
  return { row: 11, col: 11 }; // Default to Go position
}

/**
 * Select a space on the board
 */
function selectSpace(index) {
  const property = gameState.properties.find(p => p.space_number === index);
  const container = document.getElementById('propertyDetails');
  
  if (!property) {
    container.innerHTML = `
      <div class="property-card">
        <div class="property-name">Special Space</div>
        <p>This is a special space (Go, Jail, etc.)</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="property-card">
      <div class="property-name">${property.name_en}</div>
      <div class="property-name-bn">${property.name_bn}</div>
      <div class="property-price">${formatCurrency(property.price)}</div>
      <div class="property-rent">
        <div>ভাড়া: ${formatCurrency(property.rent_base)}</div>
        ${property.rent_1 ? `<div>১টি ঘর: ${formatCurrency(property.rent_1)}</div>` : ''}
        ${property.rent_2 ? `<div>২টি ঘর: ${formatCurrency(property.rent_2)}</div>` : ''}
      </div>
    </div>
  `;
}

/**
 * Roll dice
 */
function rollDice() {
  sendMessage({ type: 'roll_dice' });
  
  // Animate dice
  const die1 = document.getElementById('die1');
  const die2 = document.getElementById('die2');
  
  die1.classList.add('rolling');
  die2.classList.add('rolling');
  
  setTimeout(() => {
    die1.classList.remove('rolling');
    die2.classList.remove('rolling');
  }, 500);
}

/**
 * Handle dice roll result
 */
function handleDiceRoll(result) {
  const die1El = document.getElementById('die1');
  const die2El = document.getElementById('die2');
  const resultEl = document.getElementById('diceResult');
  
  // Update dice display
  const diceChars = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  die1El.textContent = diceChars[result.die1 - 1];
  die2El.textContent = diceChars[result.die2 - 1];
  
  // Show result
  resultEl.textContent = `মোট: ${toBanglaNumerals(result.total)}${result.isDoubles ? ' (ডাবল!)' : ''}`;
  
  // Enable action buttons
  document.getElementById('btnBuy').disabled = false;
  document.getElementById('btnEndTurn').disabled = false;
  
  logMessage(`পাশা rolled: ${result.die1} + ${result.die2} = ${result.total}`);
}

/**
 * Buy property
 */
function buyProperty() {
  logMessage('Property purchase not yet implemented');
  // TODO: Implement property purchase
}

/**
 * End turn
 */
function endTurn() {
  logMessage('Turn ended');
  
  // Reset buttons
  document.getElementById('btnBuy').disabled = true;
  document.getElementById('btnEndTurn').disabled = true;
  document.getElementById('diceResult').textContent = '';
  
  // TODO: Switch to next player
}

/**
 * Update turn indicator
 */
function updateTurnIndicator() {
  const indicator = document.getElementById('currentPlayer');
  if (gameState.currentPlayer) {
    indicator.textContent = gameState.currentPlayer.name;
  }
}

/**
 * Log message to game log
 */
function logMessage(message) {
  const container = document.getElementById('logEntries');
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = `[${new Date().toLocaleTimeString('bn-BD')}] ${message}`;
  container.insertBefore(entry, container.firstChild);
  
  // Keep only last 20 entries
  while (container.children.length > 20) {
    container.removeChild(container.lastChild);
  }
}

/**
 * Show loading overlay
 */
function showLoading() {
  document.getElementById('loadingOverlay').classList.add('active');
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('active');
}

/**
 * Initialize game on page load
 */
async function initGame() {
  showLoading();
  
  try {
    // Load initial data
    await refreshGameState();
    
    // Initialize WebSocket
    initWebSocket();
    
    logMessage('খেলা লোড হয়েছে');
  } catch (err) {
    console.error('Failed to initialize game:', err);
    logMessage('খেলা লোড করতে সমস্যা হচ্ছে');
    hideLoading();
  }
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', initGame);

// Export functions for global access
window.rollDice = rollDice;
window.buyProperty = buyProperty;
window.endTurn = endTurn;
window.selectSpace = selectSpace;
