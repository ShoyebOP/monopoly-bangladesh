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
      .action((_options) => {
        console.log('Creating new game...');
        if (!isServerRunning()) {
          console.log('Error: Server is not running. Start the server first with: node cli/start.js server start');
          return;
        }
        console.log('Game create not yet implemented');
      })
  )
  .addCommand(
    new Command('join')
      .description('Join existing game')
      .argument('<gameId>', 'Game ID to join')
      .action((gameId) => {
        console.log(`Joining game: ${gameId}`);
        if (!isServerRunning()) {
          console.log('Error: Server is not running. Start the server first with: node cli/start.js server start');
          return;
        }
        console.log('Game join not yet implemented');
      })
  )
  .addCommand(
    new Command('list')
      .description('List active games')
      .action(() => {
        console.log('Active games:');
        if (!isServerRunning()) {
          console.log('  (server not running)');
          return;
        }
        console.log('  No active games');
      })
  )
  .addCommand(
    new Command('status')
      .description('Show game details')
      .argument('<gameId>', 'Game ID')
      .action((gameId) => {
        console.log(`Game status for: ${gameId}`);
        console.log('Game status not yet implemented');
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
      .action((name) => {
        console.log(`Adding player: ${name}`);
        if (!isServerRunning()) {
          console.log('Error: Server is not running. Start the server first with: node cli/start.js server start');
          return;
        }
        console.log('Player add not yet implemented');
      })
  )
  .addCommand(
    new Command('remove')
      .description('Remove player')
      .argument('<name>', 'Player name')
      .action((name) => {
        console.log(`Removing player: ${name}`);
        if (!isServerRunning()) {
          console.log('Error: Server is not running. Start the server first with: node cli/start.js server start');
          return;
        }
        console.log('Player remove not yet implemented');
      })
  )
  .addCommand(
    new Command('list')
      .description('List all players')
      .action(() => {
        console.log('Registered players:');
        if (!isServerRunning()) {
          console.log('  (server not running)');
          return;
        }
        console.log('  No players registered');
      })
  );

program.parse();
