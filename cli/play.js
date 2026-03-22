#!/usr/bin/env node

/**
 * Monopoly Bangladesh - Interactive Play Command
 * Simple 2-player game via CLI
 */

import { Command } from 'commander';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);

// Simple game state
const gameState = {
  players: [],
  currentPlayer: 0,
  board: [],
  gameOver: false
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to prompt user
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Clear screen
function clearScreen() {
  console.clear();
}

// Display board (simplified text version) - for future use
function _displayBoard() {
  console.log('\n=== Monopoly Bangladesh Board ===\n');
  
  // Top row (20-30)
  console.log('┌────────────────────────────────────────────────────────────────────────────┐');
  console.log('│ FREE PARKING │ Dhanmondi │ Chance │ Green Rd │ Elephant Rd │ Railroad │ Kalabagan │ New Market │ WASA │ Paltan │ GO TO JAIL │');
  console.log('└────────────────────────────────────────────────────────────────────────────┘');
}

// Display player info
function displayPlayers() {
  console.log('\n=== Players ===');
  gameState.players.forEach((player, index) => {
    const marker = index === gameState.currentPlayer ? '>> ' : '   ';
    console.log(`${marker}${player.name}: ${player.money}৳ | Position: ${player.position} | Properties: ${player.properties.length}`);
  });
  console.log();
}

// Roll dice
function rollDice() {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  return { die1, die2, total: die1 + die2, isDoubles: die1 === die2 };
}

// Move player
function movePlayer(player, spaces) {
  const oldPos = player.position;
  player.position = (player.position + spaces) % 40;
  
  // Passed Go
  if (player.position < oldPos) {
    player.money += 2000;
    console.log(`  Passed Go! Collect 2000৳`);
  }
  
  return player.position;
}

// Get space info
function getSpaceInfo(position) {
  const spaces = [
    { name: 'Go', type: 'corner', price: 0 },
    { name: 'Kuril Basti', type: 'property', price: 600, color: 'brown' },
    { name: 'Community Chest', type: 'community' },
    { name: 'Karail Basti', type: 'property', price: 600, color: 'brown' },
    { name: 'Income Tax', type: 'tax', price: 2000 },
    { name: 'Kamalapur Railway', type: 'railroad', price: 2000 },
    { name: 'Mirpur', type: 'property', price: 1000, color: 'lightblue' },
    { name: 'Chance', type: 'chance' },
    { name: 'Mohammadpur', type: 'property', price: 1000, color: 'lightblue' },
    { name: 'Uttara', type: 'property', price: 1200, color: 'lightblue' },
    { name: 'Jail', type: 'corner' },
    { name: 'Tejgaon', type: 'property', price: 1400, color: 'pink' },
    { name: 'DESCO', type: 'utility', price: 1500 },
    { name: 'Khilgaon', type: 'property', price: 1400, color: 'pink' },
    { name: 'Magbazar', type: 'property', price: 1600, color: 'pink' },
    { name: 'Bimanbandar Railway', type: 'railroad', price: 2000 },
    { name: 'Malibagh', type: 'property', price: 1800, color: 'orange' },
    { name: 'Community Chest', type: 'community' },
    { name: 'Rampura', type: 'property', price: 1800, color: 'orange' },
    { name: 'Basabo', type: 'property', price: 2000, color: 'orange' },
    { name: 'Free Parking', type: 'corner' },
    { name: 'Dhanmondi', type: 'property', price: 2200, color: 'red' },
    { name: 'Chance', type: 'chance' },
    { name: 'Green Road', type: 'property', price: 2200, color: 'red' },
    { name: 'Elephant Road', type: 'property', price: 2400, color: 'red' },
    { name: 'Akhataruzzaman Railway', type: 'railroad', price: 2000 },
    { name: 'Kalabagan', type: 'property', price: 2600, color: 'yellow' },
    { name: 'New Market', type: 'property', price: 2600, color: 'yellow' },
    { name: 'WASA', type: 'utility', price: 1500 },
    { name: 'Paltan', type: 'property', price: 2800, color: 'yellow' },
    { name: 'Go To Jail', type: 'corner' },
    { name: 'Shahbag', type: 'property', price: 3000, color: 'green' },
    { name: 'Karwan Bazar', type: 'property', price: 3000, color: 'green' },
    { name: 'Community Chest', type: 'community' },
    { name: 'Gulshan-1', type: 'property', price: 3200, color: 'green' },
    { name: 'Hazipur Railway', type: 'railroad', price: 2000 },
    { name: 'Chance', type: 'chance' },
    { name: 'Banani', type: 'property', price: 3500, color: 'darkblue' },
    { name: 'Luxury Tax', type: 'tax', price: 1000 },
    { name: 'Bashundhara', type: 'property', price: 4000, color: 'darkblue' }
  ];
  
  return spaces[position] || { name: 'Unknown', type: 'unknown' };
}

// Handle player turn
async function handleTurn() {
  const player = gameState.players[gameState.currentPlayer];
  
  console.log(`\n=== ${player.name}'s Turn ===`);
  console.log(`Money: ${player.money}৳ | Position: ${player.position} (${getSpaceInfo(player.position).name})`);
  console.log('\nActions: [roll] Roll Dice | [info] Show Space Info | [buy] Buy Property | [end] End Turn | [quit] Quit Game');
  
  const action = await prompt('\nYour action? ');
  
  switch (action.toLowerCase()) {
    case 'roll':
    case 'r':
      const dice = rollDice();
      console.log(`\n🎲 Rolled: ${dice.die1} + ${dice.die2} = ${dice.total}${dice.isDoubles ? ' (DOUBLES!)' : ''}`);
      
      const newPos = movePlayer(player, dice.total);
      const space = getSpaceInfo(newPos);
      console.log(`  Moved to: ${space.name} (Space ${newPos})`);
      
      // Handle Go To Jail
      if (newPos === 30) {
        console.log('  Go directly to Jail!');
        player.position = 10;
      }
      
      // Offer to buy property
      if (space.type === 'property' && space.price && player.money >= space.price) {
        console.log(`  This property costs ${space.price}৳`);
        const buyChoice = await prompt('  Buy it? (y/n) ');
        if (buyChoice.toLowerCase() === 'y') {
          player.money -= space.price;
          player.properties.push(newPos);
          console.log(`  Purchased ${space.name}!`);
        }
      } else if (space.type === 'property' && space.price && player.money < space.price) {
        console.log(`  Not enough money to buy ${space.name} (${space.price}৳)`);
      }
      
      break;
      
    case 'info':
    case 'i':
      const currentSpace = getSpaceInfo(player.position);
      console.log(`\n📍 Current Space: ${currentSpace.name}`);
      console.log(`   Type: ${currentSpace.type}`);
      if (currentSpace.price) {
        console.log(`   Price: ${currentSpace.price}৳`);
      }
      break;
      
    case 'buy':
    case 'b':
      const buySpace = getSpaceInfo(player.position);
      if (buySpace.type === 'property' && buySpace.price) {
        if (player.money >= buySpace.price) {
          player.money -= buySpace.price;
          player.properties.push(player.position);
          console.log(`Purchased ${buySpace.name} for ${buySpace.price}৳!`);
        } else {
          console.log('Not enough money!');
        }
      } else {
        console.log('Cannot buy this space!');
      }
      break;
      
    case 'end':
    case 'e':
      // Move to next player
      gameState.currentPlayer = (gameState.currentPlayer + 1) % gameState.players.length;
      console.log(`\n--- End of ${player.name}'s turn. Next: ${gameState.players[gameState.currentPlayer].name} ---`);
      break;
      
    case 'quit':
    case 'q':
      gameState.gameOver = true;
      console.log('\nGame ended. Thanks for playing!');
      break;
      
    default:
      console.log('Invalid action. Try: roll, info, buy, end, or quit');
  }
}

// Setup game
async function setupGame() {
  clearScreen();
  console.log('=== Monopoly Bangladesh - CLI Game ===\n');
  
  // Get player names
  const player1Name = await prompt('Player 1 name: ') || 'Player 1';
  const player2Name = await prompt('Player 2 name: ') || 'Player 2';
  
  // Initialize players
  gameState.players = [
    { name: player1Name, money: 15000, position: 0, properties: [] },
    { name: player2Name, money: 15000, position: 0, properties: [] }
  ];
  
  console.log(`\nGame started! ${player1Name} vs ${player2Name}`);
  console.log('Each player starts with 15000৳');
}

// Main game loop
async function gameLoop() {
  await setupGame();
  
  while (!gameState.gameOver) {
    displayPlayers();
    await handleTurn();
  }
  
  // Show final scores
  console.log('\n=== Final Scores ===');
  gameState.players.forEach(player => {
    console.log(`${player.name}: ${player.money}৳ | Properties: ${player.properties.length}`);
  });
  
  rl.close();
}

// CLI Command
const program = new Command();

program
  .name('monopoly-bangladesh play')
  .description('Start an interactive 2-player Monopoly game')
  .action(() => {
    console.log('Starting interactive Monopoly game...\n');
    gameLoop().catch(console.error);
  });

program.parse();
