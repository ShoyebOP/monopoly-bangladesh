#!/usr/bin/env node

/**
 * Monopoly Bangladesh CLI
 * Main entry point for CLI commands
 */

import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Read package.json for version
const packageJson = JSON.parse(
  fs.readFileSync(join(rootDir, 'package.json'), 'utf8')
);

// PID file path for server process
const pidFile = join(rootDir, '.server.pid');

// Helper function to check if server is running
function isServerRunning() {
  if (!fs.existsSync(pidFile)) {
    return false;
  }
  
  try {
    const pid = parseInt(fs.readFileSync(pidFile, 'utf8').trim(), 10);
    // Check if process exists
    process.kill(pid, 0);
    return true;
  } catch {
    // Process doesn't exist or can't be checked
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }
    return false;
  }
}

// Helper function to get server PID
function getServerPid() {
  if (!fs.existsSync(pidFile)) {
    return null;
  }
  return parseInt(fs.readFileSync(pidFile, 'utf8').trim(), 10);
}

const program = new Command();

program
  .name('monopoly-bangladesh')
  .description('Monopoly Bangladesh - CLI for game management')
  .version(packageJson.version);

// Play command - Interactive game
program
  .command('play')
  .description('Start an interactive 2-player Monopoly game')
  .action(() => {
    const playPath = join(rootDir, 'cli', 'play.js');
    spawn('node', [playPath], {
      cwd: rootDir,
      stdio: 'inherit'
    });
  });

// Server commands
program
  .command('server')
  .description('Server management commands')
  .addCommand(
    new Command('start')
      .description('Launch game server')
      .option('-p, --port <port>', 'Port to run server on', '3000')
      .action((options) => {
        const port = options.port;
        
        if (isServerRunning()) {
          console.log(`Server is already running (PID ${getServerPid()})`);
          return;
        }
        
        console.log(`Starting server on port ${port}...`);
        
        const serverPath = join(rootDir, 'src', 'server.js');
        
        // Check if server.js exists
        if (!fs.existsSync(serverPath)) {
          console.log('Server module not found. Creating basic server...');
          // Create a basic server file if it doesn't exist
          const basicServer = `import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(join(rootDir, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(\`Monopoly Bangladesh server running on port \${PORT}\`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
`;
          fs.writeFileSync(serverPath, basicServer);
        }
        
        // Start server in background
        const serverProcess = spawn('node', [serverPath], {
          cwd: rootDir,
          env: { ...process.env, PORT: port },
          detached: true,
          stdio: 'ignore'
        });
        
        // Write PID file
        fs.writeFileSync(pidFile, serverProcess.pid.toString());
        
        console.log(`Server started with PID ${serverProcess.pid}`);
        console.log(`Access the game at http://localhost:${port}`);
      })
  )
  .addCommand(
    new Command('stop')
      .description('Stop running server')
      .action(() => {
        if (!isServerRunning()) {
          console.log('Server is not running');
          return;
        }
        
        const pid = getServerPid();
        console.log(`Stopping server (PID ${pid})...`);
        
        try {
          process.kill(pid, 'SIGTERM');
          console.log('Server stopped successfully');
          fs.unlinkSync(pidFile);
        } catch (err) {
          console.log('Failed to stop server:', err.message);
          // Force remove PID file
          if (fs.existsSync(pidFile)) {
            fs.unlinkSync(pidFile);
          }
        }
      })
  )
  .addCommand(
    new Command('status')
      .description('Show server status')
      .action(() => {
        if (isServerRunning()) {
          const pid = getServerPid();
          console.log(`Server is running (PID ${pid})`);
          console.log('Status: healthy');
        } else {
          console.log('Server is not running');
          console.log('Status: stopped');
        }
      })
  );

// Game commands
program
  .command('game')
  .description('Game management commands')
  .addCommand(
    new Command('create')
      .description('Create new game session')
      .option('-n, --name <name>', 'Game name')
      .option('-p, --players <ids>', 'Player IDs (comma-separated)')
      .action(async (options) => {
        console.log('Creating new game...');
        
        const port = process.env.PORT || '3000';
        const baseUrl = `http://localhost:${port}`;
        
        let playerIds = [];
        if (options.players) {
          playerIds = options.players.split(',').map(id => parseInt(id.trim()));
        }
        
        try {
          const res = await fetch(`${baseUrl}/api/games`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: options.name || `Game ${Date.now()}`,
              playerIds
            })
          });
          
          const game = await res.json();
          
          if (res.ok) {
            console.log(`Game created!`);
            console.log(`  ID: ${game.id}`);
            console.log(`  Name: ${game.name}`);
            console.log(`  Players: ${game.playerIds?.join(', ') || 'None'}`);
            console.log(`\nOpen: ${baseUrl}/lobby.html?id=${game.id}`);
          } else {
            console.log(`Error: ${game.error}`);
          }
        } catch {
          console.log(`Error: Cannot connect to server`);
        }
      })
  )
  .addCommand(
    new Command('join')
      .description('Join existing game')
      .argument('<gameId>', 'Game ID')
      .action((gameId) => {
        const port = process.env.PORT || '3000';
        console.log(`Join at: http://localhost:${port}/lobby.html?id=${gameId}`);
      })
  )
  .addCommand(
    new Command('list')
      .description('List active games')
      .action(async () => {
        console.log('Active games:');
        
        const port = process.env.PORT || '3000';
        const baseUrl = `http://localhost:${port}`;
        
        try {
          const res = await fetch(`${baseUrl}/api/games`);
          const games = await res.json();
          
          if (games.length === 0) {
            console.log('  No games');
          } else {
            games.forEach(game => {
              console.log(`  [${game.id}] ${game.name} (${game.status})`);
            });
          }
        } catch {
          console.log('  (cannot connect)');
        }
      })
  )
  .addCommand(
    new Command('status')
      .description('Show game details')
      .argument('<gameId>', 'Game ID')
      .action(async (gameId) => {
        console.log(`Game ${gameId}:`);
        
        const port = process.env.PORT || '3000';
        const baseUrl = `http://localhost:${port}`;
        
        try {
          const res = await fetch(`${baseUrl}/api/games/${gameId}`);
          const game = await res.json();
          
          if (res.ok) {
            console.log(`  Name: ${game.name || 'N/A'}`);
            console.log(`  Status: ${game.status || 'unknown'}`);
            console.log(`  Players:`);
            if (game.players?.length > 0) {
              game.players.forEach((p, i) => {
                const marker = i === game.currentPlayer ? ' >>' : '   ';
                console.log(`${marker} ${p.name}: ৳${p.money}, Pos: ${p.position}`);
              });
            } else {
              console.log(`    No players`);
            }
          } else {
            console.log(`  Error: ${game.error}`);
          }
        } catch {
          console.log(`  (cannot connect)`);
        }
      })
  );

// Player commands
program
  .command('player')
  .description('Player management commands')
  .addCommand(
    new Command('add')
      .description('Add new player')
      .argument('<name>', 'Player name')
      .action(async (name) => {
        console.log(`Adding player: ${name}`);
        
        const port = process.env.PORT || '3000';
        const baseUrl = `http://localhost:${port}`;
        
        try {
          const res = await fetch(`${baseUrl}/api/players`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
          });
          
          const result = await res.json();
          
          if (res.ok) {
            console.log(`Added! ID: ${result.id}, Name: ${result.name}`);
          } else {
            console.log(`Error: ${result.error}`);
          }
        } catch {
          console.log(`Error: Cannot connect to server`);
        }
      })
  )
  .addCommand(
    new Command('remove')
      .description('Remove player')
      .argument('<id>', 'Player ID')
      .action(async (id) => {
        console.log(`Removing player ${id}...`);
        
        const port = process.env.PORT || '3000';
        const baseUrl = `http://localhost:${port}`;
        
        try {
          const res = await fetch(`${baseUrl}/api/players/${id}`, { method: 'DELETE' });
          
          if (res.ok) {
            console.log(`Removed!`);
          } else {
            const result = await res.json();
            console.log(`Error: ${result.error}`);
          }
        } catch {
          console.log(`Error: Cannot connect`);
        }
      })
  )
  .addCommand(
    new Command('list')
      .description('List all players')
      .action(async () => {
        console.log('Players:');
        
        const port = process.env.PORT || '3000';
        const baseUrl = `http://localhost:${port}`;
        
        try {
          const res = await fetch(`${baseUrl}/api/players`);
          const players = await res.json();
          
          if (players.length === 0) {
            console.log('  No players');
          } else {
            players.forEach(p => {
              console.log(`  [${p.id}] ${p.name}`);
            });
          }
        } catch {
          console.log('  (cannot connect)');
        }
      })
  );

program.parse();
