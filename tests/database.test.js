import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const dbPath = join(rootDir, 'db', 'monopoly.db');

describe('Database Layer', () => {
  let dbModule;
  
  before(async () => {
    // Remove existing test database
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    
    // Import and initialize database
    dbModule = await import('../src/database.js');
  });
  
  after(() => {
    // Cleanup
    if (dbModule) {
      dbModule.closeDatabase();
    }
  });
  
  describe('Database Initialization', () => {
    it('should initialize database successfully', async () => {
      const db = await dbModule.initDatabase();
      assert.ok(db, 'Database should be initialized');
    });
    
    it('should return existing database instance on subsequent calls', async () => {
      const db1 = await dbModule.initDatabase();
      const db2 = await dbModule.initDatabase();
      assert.strictEqual(db1, db2, 'Should return same database instance');
    });
    
    it('should create database file', async () => {
      await dbModule.initDatabase();
      dbModule.saveDatabase();
      assert.ok(fs.existsSync(dbPath), 'Database file should exist');
    });
  });
  
  describe('Database Tables', () => {
    it('should have players table', async () => {
      const db = await dbModule.initDatabase();
      const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='players'");
      assert.strictEqual(result.length, 1, 'Players table should exist');
    });
    
    it('should have games table', async () => {
      const db = await dbModule.initDatabase();
      const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='games'");
      assert.strictEqual(result.length, 1, 'Games table should exist');
    });
    
    it('should have game_players table', async () => {
      const db = await dbModule.initDatabase();
      const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='game_players'");
      assert.strictEqual(result.length, 1, 'Game_players table should exist');
    });
    
    it('should have properties table', async () => {
      const db = await dbModule.initDatabase();
      const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='properties'");
      assert.strictEqual(result.length, 1, 'Properties table should exist');
    });
    
    it('should have game_properties table', async () => {
      const db = await dbModule.initDatabase();
      const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='game_properties'");
      assert.strictEqual(result.length, 1, 'Game_properties table should exist');
    });
  });
  
  describe('Properties Data', () => {
    it('should have property data initialized', async () => {
      const db = await dbModule.initDatabase();
      const result = db.exec('SELECT COUNT(*) FROM properties');
      const count = result[0].values[0][0];
      assert.ok(count > 0, 'Properties should be initialized');
      assert.ok(count >= 22, 'Should have at least 22 properties');
    });
    
    it('should have Bangladeshi property names', async () => {
      const db = await dbModule.initDatabase();
      const result = db.exec("SELECT name_bn FROM properties WHERE name_en = 'Dhanmondi'");
      assert.strictEqual(result.length, 1, 'Dhanmondi property should exist');
      assert.strictEqual(result[0].values[0][0], 'ধানমন্ডি', 'Should have Bangla name');
    });
  });
  
  describe('Player Operations', () => {
    it('should create a player', async () => {
      const db = await dbModule.initDatabase();
      db.run("INSERT INTO players (name) VALUES ('Test Player')");
      dbModule.saveDatabase();
      
      const result = db.exec("SELECT * FROM players WHERE name = 'Test Player'");
      assert.strictEqual(result.length, 1, 'Player should be created');
      assert.strictEqual(result[0].values[0][1], 'Test Player', 'Player name should match');
    });
    
    it('should enforce unique player names', async () => {
      const db = await dbModule.initDatabase();
      assert.throws(() => {
        db.run("INSERT INTO players (name) VALUES ('Test Player')");
      }, /UNIQUE constraint failed/, 'Should throw unique constraint error');
    });
  });
  
  describe('Game Operations', () => {
    it('should create a game', async () => {
      const db = await dbModule.initDatabase();
      db.run("INSERT INTO games (name, status) VALUES ('Test Game', 'waiting')");
      dbModule.saveDatabase();
      
      const result = db.exec("SELECT * FROM games WHERE name = 'Test Game'");
      assert.strictEqual(result.length, 1, 'Game should be created');
      assert.strictEqual(result[0].values[0][2], 'waiting', 'Game status should be waiting');
    });
  });
});
