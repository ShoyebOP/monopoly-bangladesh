/**
 * Monopoly Bangladesh - Lobby JavaScript
 */

const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get('id');

let gamePlayers = [];
let selectedPlayerId = null;

const playerList = document.getElementById('playerList');
const gameInfo = document.getElementById('gameInfo');
const btnJoin = document.getElementById('btnJoin');
const loadingOverlay = document.getElementById('loadingOverlay');

function showLoading() {
  loadingOverlay.classList.add('active');
}

function hideLoading() {
  loadingOverlay.classList.remove('active');
}

async function loadGame() {
  if (!gameId) {
    gameInfo.innerHTML = '<p class="error">No game ID. Create game via CLI first: node cli/start.js game create -p 1,2</p>';
    playerList.innerHTML = '';
    return;
  }

  try {
    const res = await fetch(`/api/games/${gameId}`);
    if (!res.ok) {throw new Error('Game not found');}
    const game = await res.json();

    gameInfo.innerHTML = `
      <div class="game-name">${game.name || 'Game #' + game.id}</div>
      <div class="game-detail">Game ID: ${game.id}</div>
      <div class="game-detail">Players: ${game.players ? game.players.length : 0}</div>
    `;

    gamePlayers = game.players || [];
    if (gamePlayers.length === 0) {
      playerList.innerHTML = '<p>No players. Add via CLI: node cli/start.js player add "Name"</p>';
      btnJoin.disabled = true;
      return;
    }

    playerList.innerHTML = gamePlayers.map(player => `
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

  } catch {
    gameInfo.innerHTML = '<p class="error">Game not found</p>';
    playerList.innerHTML = '';
    btnJoin.disabled = true;
  }
}

btnJoin.addEventListener('click', () => {
  if (!selectedPlayerId) {return;}
  window.location.href = `/game.html?id=${gameId}&player=${selectedPlayerId}`;
});

showLoading();
loadGame().finally(() => hideLoading());
