/**
 * Monopoly Bangladesh - Lobby JavaScript
 */

let allGames = [];
let selectedGameId = null;
let selectedPlayerId = null;

const gamesList = document.getElementById('gamesList');
const playerSection = document.getElementById('playerSection');
const playerList = document.getElementById('playerList');
const gamePlayersInfo = document.getElementById('gamePlayersInfo');
const btnJoin = document.getElementById('btnJoin');
const btnAddPlayer = document.getElementById('btnAddPlayer');
const newPlayerName = document.getElementById('newPlayerName');
const loadingOverlay = document.getElementById('loadingOverlay');

function showLoading() {
  loadingOverlay.classList.add('active');
}

function hideLoading() {
  loadingOverlay.classList.remove('active');
}

async function loadGames() {
  try {
    const res = await fetch('/api/games');
    allGames = await res.json();
    renderGames();
  } catch {
    gamesList.innerHTML = '<p>Failed to load games</p>';
  }
}

function renderGames() {
  if (allGames.length === 0) {
    gamesList.innerHTML = '<p>No games yet. Create one via CLI:</p><code>node cli/start.js game create -p 1,2</code>';
    return;
  }
  
  gamesList.innerHTML = allGames.map(game => `
    <div class="game-item ${selectedGameId === game.id ? 'selected' : ''}" data-id="${game.id}">
      <div class="game-name">${game.name || 'Game #' + game.id}</div>
      <div class="game-info">ID: ${game.id} | Status: ${game.status} | Created: ${new Date(game.created_at).toLocaleString('bn-BD')}</div>
    </div>
  `).join('');
  
  gamesList.querySelectorAll('.game-item').forEach(item => {
    item.addEventListener('click', async () => {
      selectedGameId = parseInt(item.dataset.id);
      gamesList.querySelectorAll('.game-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      
      // Load game details
      await loadGamePlayers();
    });
  });
}

async function loadGamePlayers() {
  if (!selectedGameId) {return;}
  
  try {
    const res = await fetch(`/api/games/${selectedGameId}`);
    const game = await res.json();
    
    const players = game.players || [];
    
    if (players.length === 0) {
      gamePlayersInfo.innerHTML = `<p>No players in this game.</p>`;
      playerList.innerHTML = '<p>Add players via CLI or below</p>';
      playerSection.style.display = 'none';
      return;
    }
    
    gamePlayersInfo.innerHTML = `
      <p><strong>Game:</strong> ${game.name || 'Game #' + game.id}</p>
      <p><strong>Players (${players.length}):</strong></p>
      <ul>
        ${players.map(p => `<li>${p.name} - ৳${p.money} (Pos: ${p.position})</li>`).join('')}
      </ul>
    `;
    
    playerList.innerHTML = players.map(player => `
      <div class="player-option" data-id="${player.id}">${player.name}</div>
    `).join('');
    
    playerList.querySelectorAll('.player-option').forEach(option => {
      option.addEventListener('click', () => {
        selectedPlayerId = parseInt(option.dataset.id);
        playerList.querySelectorAll('.player-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        btnJoin.disabled = false;
      });
    });
    
    playerSection.style.display = 'block';
    btnJoin.disabled = true;
    
  } catch {
    gamePlayersInfo.innerHTML = '<p>Failed to load game details</p>';
    playerSection.style.display = 'none';
  }
}

btnJoin.addEventListener('click', () => {
  if (!selectedGameId || !selectedPlayerId) {return;}
  window.location.href = `/game.html?id=${selectedGameId}&player=${selectedPlayerId}`;
});

btnAddPlayer.addEventListener('click', async () => {
  const name = newPlayerName.value.trim();
  if (!name) {return;}
  
  try {
    const res = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    
    if (res.ok) {
      newPlayerName.value = '';
      if (selectedGameId) {await loadGamePlayers();}
      alert('Player added!');
    } else {
      const result = await res.json();
      alert('Error: ' + result.error);
    }
  } catch {
    alert('Failed to add player');
  }
});

// Initialize
showLoading();
loadGames().finally(() => hideLoading());
