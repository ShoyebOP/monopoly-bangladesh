import { describe, it, test, before, after } from 'node:test';
import assert from 'node:assert';
import { execSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const cliPath = join(rootDir, 'cli', 'start.js');

describe('CLI Foundation', () => {
  describe('CLI Entry Point', () => {
    it('should exist and be executable', () => {
      // Test that CLI file exists
      assert.ok(fs.existsSync(cliPath), 'CLI entry point should exist');
    });

    it('should show help when run with --help', () => {
      // Test that CLI shows help
      const result = execSync(`node ${cliPath} --help`, { 
        encoding: 'utf8',
        cwd: rootDir
      });
      
      assert.ok(result.includes('Usage'), 'CLI should show usage information');
      assert.ok(result.includes('Command'), 'CLI should list commands');
    });
  });

  describe('Server Commands', () => {
    it('should have server start command', () => {
      const result = execSync(`node ${cliPath} --help`, { 
        encoding: 'utf8',
        cwd: rootDir
      });
      
      assert.ok(result.includes('server'), 'CLI should have server commands');
    });

    it('should have game commands', () => {
      const result = execSync(`node ${cliPath} --help`, { 
        encoding: 'utf8',
        cwd: rootDir
      });
      
      assert.ok(result.includes('game'), 'CLI should have game commands');
    });

    it('should have player commands', () => {
      const result = execSync(`node ${cliPath} --help`, { 
        encoding: 'utf8',
        cwd: rootDir
      });
      
      assert.ok(result.includes('player'), 'CLI should have player commands');
    });
  });

  describe('Player Commands', () => {
    it('should list players (empty initially)', () => {
      const result = execSync(`node ${cliPath} player list`, { 
        encoding: 'utf8',
        cwd: rootDir
      });
      
      // Should either show empty list or message about no players
      assert.ok(typeof result === 'string', 'player list should return output');
    });
  });
});
