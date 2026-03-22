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
  const spaces = generateBoardSpaces();

  board.innerHTML = spaces.map((space) => {
    const gridPos = getGridPosition(space.index);
    const hasColorBar = space.color && space.type === 'property';

    return `
      <div class="space ${space.type} ${space.color || ''}"
           style="grid-column: ${gridPos.col}; grid-row: ${gridPos.row};"
           onclick="selectSpace(${space.index})">
        ${hasColorBar ? `<div class="color-bar"></div>` : ''}
        <div class="space-name">${space.name_bn || space.name}</div>
        ${space.price ? `<div class="space-price">${formatCurrency(space.price)}</div>` : ''}
        <div class="player-tokens" id="tokens-${space.index}"></div>
      </div>
    `;
  }).join('');
}

/**
 * Generate board spaces data
 * Standard Monopoly board: 40 spaces (0-39), counter-clockwise from Go at bottom-right
 */
function generateBoardSpaces() {
  // Standard Monopoly board layout (space numbers match official board)
  const spaces = [
    // Bottom row: 0-10 (right to left)
    { index: 0, name: 'শুরু', name_en: 'Go', name_bn: 'শুরু (Go)', type: 'corner', price: null },
    { index: 1, name: 'কুরিল বস্তি', name_en: 'Kuril Basti', name_bn: 'কুরিল বস্তি', type: 'property', color: 'brown', price: 60 },
    { index: 2, name: 'কমিউনিটি ফান্ড', name_en: 'Community Chest', name_bn: 'কমিউনিটি ফান্ড', type: 'community' },
    { index: 3, name: 'করাইল বস্তি', name_en: 'Karail Basti', name_bn: 'করাইল বস্তি', type: 'property', color: 'brown', price: 60 },
    { index: 4, name: 'আয়কর', name_en: 'Income Tax', name_bn: 'আয়কর', type: 'tax', price: 200 },
    { index: 5, name: 'কমলাপুর', name_en: 'Kamalapur Railway Station', name_bn: 'কমলাপুর রেলওয়ে স্টেশন', type: 'railroad', price: 200 },
    { index: 6, name: 'মিরপুর', name_en: 'Mirpur', name_bn: 'মিরপুর', type: 'property', color: 'lightblue', price: 100 },
    { index: 7, name: 'সুযোগ', name_en: 'Chance', name_bn: 'সুযোগ', type: 'chance' },
    { index: 8, name: 'মোহাম্মদপুর', name_en: 'Mohammadpur', name_bn: 'মোহাম্মদপুর', type: 'property', color: 'lightblue', price: 100 },
    { index: 9, name: 'উত্তরা', name_en: 'Uttara', name_bn: 'উত্তরা', type: 'property', color: 'lightblue', price: 120 },
    // Corner: 10 (Jail)
    { index: 10, name: 'কারাগার', name_en: 'Jail', name_bn: 'কারাগার', type: 'corner' },
    
    // Left column: 11-20 (bottom to top)
    { index: 11, name: 'তেজগাঁও', name_en: 'Tejgaon', name_bn: 'তেজগাঁও', type: 'property', color: 'pink', price: 140 },
    { index: 12, name: 'ডেসকো', name_en: 'DESCO', name_bn: 'ডেসকো', type: 'utility', price: 150 },
    { index: 13, name: 'খিলগাঁও', name_en: 'Khilgaon', name_bn: 'খিলগাঁও', type: 'property', color: 'pink', price: 140 },
    { index: 14, name: 'বিমানবন্দর', name_en: 'Bimanbandar Railway Station', name_bn: 'বিমানবন্দর রেলওয়ে স্টেশন', type: 'railroad', price: 200 },
    { index: 15, name: 'মগবাজার', name_en: 'Magbazar', name_bn: 'মগবাজার', type: 'property', color: 'pink', price: 160 },
    { index: 16, name: 'কমিউনিটি ফান্ড', name_en: 'Community Chest', name_bn: 'কমিউনিটি ফান্ড', type: 'community' },
    { index: 17, name: 'মালিবাগ', name_en: 'Malibagh', name_bn: 'মালিবাগ', type: 'property', color: 'orange', price: 180 },
    { index: 18, name: 'রামপুরা', name_en: 'Rampura', name_bn: 'রামপুরা', type: 'property', color: 'orange', price: 180 },
    // Corner: 20 (Free Parking)
    { index: 20, name: 'বিনামূল্যে পার্কিং', name_en: 'Free Parking', name_bn: 'বিনামূল্যে পার্কিং', type: 'corner' },
    
    // Top row: 21-30 (left to right)
    { index: 21, name: 'বাসা বো', name_en: 'Basabo', name_bn: 'বাসা বো', type: 'property', color: 'orange', price: 200 },
    { index: 22, name: 'সুযোগ', name_en: 'Chance', name_bn: 'সুযোগ', type: 'chance' },
    { index: 23, name: 'ধানমন্ডি', name_en: 'Dhanmondi', name_bn: 'ধানমন্ডি', type: 'property', color: 'red', price: 220 },
    { index: 24, name: 'গ্রিন রোড', name_en: 'Green Road', name_bn: 'গ্রিন রোড', type: 'property', color: 'red', price: 220 },
    { index: 25, name: 'আখতারুজ্জামান', name_en: 'Akhataruzzaman Railway Station', name_bn: 'আখতারুজ্জামান রেলওয়ে স্টেশন', type: 'railroad', price: 200 },
    { index: 26, name: 'এলিফ্যান্ট রোড', name_en: 'Elephant Road', name_bn: 'এলিফ্যান্ট রোড', type: 'property', color: 'red', price: 240 },
    { index: 27, name: 'ওয়াসা', name_en: 'WASA', name_bn: 'ওয়াসা', type: 'utility', price: 150 },
    { index: 28, name: 'কারাগারে যান', name_en: 'Go To Jail', name_bn: 'কারাগারে যান', type: 'corner' },
    
    // Right column: 29-39 (top to bottom)
    { index: 29, name: 'কলাবাগান', name_en: 'Kalabagan', name_bn: 'কলাবাগান', type: 'property', color: 'yellow', price: 260 },
    { index: 30, name: 'নিউ মার্কেট', name_en: 'New Market', name_bn: 'নিউ মার্কেট', type: 'property', color: 'yellow', price: 260 },
    { index: 31, name: 'কমিউনিটি ফান্ড', name_en: 'Community Chest', name_bn: 'কমিউনিটি ফান্ড', type: 'community' },
    { index: 32, name: 'পল্টন', name_en: 'Paltan', name_bn: 'পল্টন', type: 'property', color: 'yellow', price: 280 },
    { index: 33, name: 'হাজীপুর', name_en: 'Hazipur Railway Station', name_bn: 'হাজীপুর রেলওয়ে স্টেশন', type: 'railroad', price: 200 },
    { index: 34, name: 'সুযোগ', name_en: 'Chance', name_bn: 'সুযোগ', type: 'chance' },
    { index: 35, name: 'শাহবাগ', name_en: 'Shahbag', name_bn: 'শাহবাগ', type: 'property', color: 'green', price: 300 },
    { index: 36, name: 'কারওয়ান বাজার', name_en: 'Karwan Bazar', name_bn: 'কারওয়ান বাজার', type: 'property', color: 'green', price: 300 },
    { index: 37, name: 'বনানী', name_en: 'Banani', name_bn: 'বনানী', type: 'property', color: 'darkblue', price: 350 },
    { index: 38, name: 'বসুন্ধরা', name_en: 'Bashundhara', name_bn: 'বসুন্ধরা', type: 'property', color: 'darkblue', price: 400 }
  ];
  
  return spaces;
}

/**
 * Get grid position for a space index
 * Standard Monopoly board layout (40 spaces, 0-39):
 * - Go (0) is at bottom-right corner
 * - Board goes counter-clockwise
 * - Bottom row: 0-10 (Go → Jail, right to left)
 * - Left column: 10-20 (Jail → Free Parking, bottom to top)  
 * - Top row: 20-30 (Free Parking → Go To Jail, left to right)
 * - Right column: 30-40/0 (Go To Jail → Go, top to bottom)
 */
function getGridPosition(index) {
  // Board is 11x11 grid (positions 1-11 for both row and col)
  // Corners are at: (11,11)=Go, (11,1)=Jail, (1,1)=Free Parking, (1,11)=Go To Jail
  
  if (index >= 0 && index <= 10) {
    // Bottom row: Go(0) at col 11 → Jail(10) at col 1
    return { row: 11, col: 11 - index };
  } else if (index >= 11 && index <= 20) {
    // Left column: Jail(10) at row 11 → Free Parking(20) at row 1
    return { row: 11 - (index - 10), col: 1 };
  } else if (index >= 21 && index <= 30) {
    // Top row: Free Parking(20) at col 1 → Go To Jail(30) at col 11
    return { row: 1, col: index - 19 };
  } else if (index >= 31 && index <= 39) {
    // Right column: Go To Jail(30) at row 1 → Bashundhara(38) at row 9, then back to Go
    return { row: index - 29, col: 11 };
  }
  
  // Default to Go position
  return { row: 11, col: 11 };
}

/**
 * Select a space on the board
 */
function selectSpace(index) {
  const spaces = generateBoardSpaces();
  const space = spaces.find(s => s.index === index);
  const container = document.getElementById('propertyDetails');

  if (!space) {
    container.innerHTML = `<p class="empty-state">Invalid space</p>`;
    return;
  }

  // Handle special spaces (corners, chance, community chest, tax)
  if (space.type === 'corner') {
    container.innerHTML = `
      <div class="property-card">
        <div class="property-name">${space.name_en || space.name_bn}</div>
        <div class="property-name-bn">${space.name_bn}</div>
        <p>Special corner space</p>
      </div>
    `;
    return;
  }

  if (space.type === 'chance') {
    container.innerHTML = `
      <div class="property-card">
        <div class="property-name">সুযোগ (Chance)</div>
        <p>Draw a Chance card</p>
      </div>
    `;
    return;
  }

  if (space.type === 'community') {
    container.innerHTML = `
      <div class="property-card">
        <div class="property-name">কমিউনিটি ফান্ড (Community Fund)</div>
        <p>Draw a Community Fund card</p>
      </div>
    `;
    return;
  }

  if (space.type === 'tax') {
    container.innerHTML = `
      <div class="property-card">
        <div class="property-name">${space.name_en}</div>
        <div class="property-name-bn">${space.name_bn}</div>
        <div class="property-price">${formatCurrency(space.price)}</div>
        <p>Tax space</p>
      </div>
    `;
    return;
  }

  // Handle railroads
  if (space.type === 'railroad') {
    container.innerHTML = `
      <div class="property-card">
        <div class="property-name">${space.name_en}</div>
        <div class="property-name-bn">${space.name_bn}</div>
        <div class="property-price">${formatCurrency(space.price)}</div>
        <div class="property-rent">
          <div>১টি রেল: ${formatCurrency(25)}</div>
          <div>২টি রেল: ${formatCurrency(50)}</div>
          <div>৩টি রেল: ${formatCurrency(100)}</div>
          <div>৪টি রেল: ${formatCurrency(200)}</div>
        </div>
      </div>
    `;
    return;
  }

  // Handle utilities
  if (space.type === 'utility') {
    container.innerHTML = `
      <div class="property-card">
        <div class="property-name">${space.name_en}</div>
        <div class="property-name-bn">${space.name_bn}</div>
        <div class="property-price">${formatCurrency(space.price)}</div>
        <div class="property-rent">
          <div>১টি ইউটিলিটি: ৪× পাশা</div>
          <div>২টি ইউটিলিটি: ১০× পাশা</div>
        </div>
      </div>
    `;
    return;
  }

  // Handle properties
  if (space.type === 'property') {
    container.innerHTML = `
      <div class="property-card">
        <div class="property-name">${space.name_en}</div>
        <div class="property-name-bn">${space.name_bn}</div>
        <div class="property-price">${formatCurrency(space.price)}</div>
        <div class="property-rent">
          <div>ভাড়া: ${formatCurrency(space.rent_base || 0)}</div>
          ${space.rent_1 ? `<div>১টি ঘর: ${formatCurrency(space.rent_1)}</div>` : ''}
          ${space.rent_2 ? `<div>২টি ঘর: ${formatCurrency(space.rent_2)}</div>` : ''}
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `<p class="empty-state">Unknown space type</p>`;
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
