/**
 * Database module for Monopoly Bangladesh
 * Handles SQLite database connections and operations
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import initSqlJs from 'sql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const dbDir = join(rootDir, 'db');
const dbPath = join(dbDir, 'monopoly.db');

// Ensure db directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;

/**
 * Initialize the database connection
 */
export async function initDatabase() {
  if (db) {
    return db;
  }

  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    await createTables();
  }
  
  return db;
}

/**
 * Create database tables
 */
async function createTables() {
  // Players table
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Games table
  db.run(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'waiting',
      state_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Game players junction table
  db.run(`
    CREATE TABLE IF NOT EXISTS game_players (
      game_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      player_color TEXT,
      player_token TEXT,
      money INTEGER DEFAULT 1500,
      position INTEGER DEFAULT 0,
      is_bankrupt INTEGER DEFAULT 0,
      PRIMARY KEY (game_id, player_id),
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    )
  `);

  // Properties base data table
  db.run(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      space_number INTEGER NOT NULL UNIQUE,
      name_en TEXT NOT NULL,
      name_bn TEXT NOT NULL,
      type TEXT NOT NULL,
      price INTEGER NOT NULL,
      rent_base INTEGER NOT NULL,
      rent_1 INTEGER,
      rent_2 INTEGER,
      rent_3 INTEGER,
      rent_4 INTEGER,
      rent_hotel INTEGER,
      house_cost INTEGER,
      color_group TEXT
    )
  `);

  // Game-specific property state
  db.run(`
    CREATE TABLE IF NOT EXISTS game_properties (
      game_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      owner_player_id INTEGER,
      houses INTEGER DEFAULT 0,
      hotels INTEGER DEFAULT 0,
      is_mortgaged INTEGER DEFAULT 0,
      PRIMARY KEY (game_id, property_id),
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
      FOREIGN KEY (owner_player_id) REFERENCES players(id) ON DELETE SET NULL
    )
  `);

  // Initialize properties data
  initializeProperties();
  
  saveDatabase();
}

/**
 * Initialize property data for Bangladesh localization
 */
function initializeProperties() {
  const properties = [
    // Brown properties (lowest income)
    { space: 2, name_en: 'Kuril Basti', name_bn: 'কুরিল বস্তি', type: 'property', price: 60, rent_base: 2, rent_1: 10, rent_2: 30, rent_3: 90, rent_4: 160, rent_hotel: 250, house_cost: 50, color: 'brown' },
    { space: 4, name_en: 'Karail Basti', name_bn: 'করাইল বস্তি', type: 'property', price: 60, rent_base: 4, rent_1: 20, rent_2: 60, rent_3: 180, rent_4: 320, rent_hotel: 450, house_cost: 50, color: 'brown' },
    
    // Light blue properties
    { space: 7, name_en: 'Mirpur', name_bn: 'মিরপুর', type: 'property', price: 100, rent_base: 6, rent_1: 30, rent_2: 90, rent_3: 270, rent_4: 400, rent_hotel: 550, house_cost: 50, color: 'lightblue' },
    { space: 9, name_en: 'Mohammadpur', name_bn: 'মোহাম্মদপুর', type: 'property', price: 100, rent_base: 6, rent_1: 30, rent_2: 90, rent_3: 270, rent_4: 400, rent_hotel: 550, house_cost: 50, color: 'lightblue' },
    { space: 10, name_en: 'Uttara', name_bn: 'উত্তরা', type: 'property', price: 120, rent_base: 8, rent_1: 40, rent_2: 100, rent_3: 300, rent_4: 450, rent_hotel: 600, house_cost: 50, color: 'lightblue' },
    
    // Pink properties
    { space: 13, name_en: 'Tejgaon', name_bn: 'তেজগাঁও', type: 'property', price: 140, rent_base: 10, rent_1: 50, rent_2: 150, rent_3: 450, rent_4: 625, rent_hotel: 750, house_cost: 100, color: 'pink' },
    { space: 14, name_en: 'Khilgaon', name_bn: 'খিলগাঁও', type: 'property', price: 140, rent_base: 10, rent_1: 50, rent_2: 150, rent_3: 450, rent_4: 625, rent_hotel: 750, house_cost: 100, color: 'pink' },
    { space: 16, name_en: 'Magbazar', name_bn: 'মগবাজার', type: 'property', price: 160, rent_base: 12, rent_1: 60, rent_2: 180, rent_3: 500, rent_4: 700, rent_hotel: 900, house_cost: 100, color: 'pink' },
    
    // Orange properties
    { space: 19, name_en: 'Malibagh', name_bn: 'মালিবাগ', type: 'property', price: 180, rent_base: 14, rent_1: 70, rent_2: 200, rent_3: 550, rent_4: 750, rent_hotel: 950, house_cost: 100, color: 'orange' },
    { space: 21, name_en: 'Rampura', name_bn: 'রামপুরা', type: 'property', price: 180, rent_base: 14, rent_1: 70, rent_2: 200, rent_3: 550, rent_4: 750, rent_hotel: 950, house_cost: 100, color: 'orange' },
    { space: 23, name_en: 'Basabo', name_bn: 'বাসা বো', type: 'property', price: 200, rent_base: 16, rent_1: 80, rent_2: 220, rent_3: 600, rent_4: 800, rent_hotel: 1000, house_cost: 100, color: 'orange' },
    
    // Red properties
    { space: 26, name_en: 'Dhanmondi', name_bn: 'ধানমন্ডি', type: 'property', price: 220, rent_base: 18, rent_1: 90, rent_2: 250, rent_3: 700, rent_4: 875, rent_hotel: 1050, house_cost: 150, color: 'red' },
    { space: 27, name_en: 'Green Road', name_bn: 'গ্রিন রোড', type: 'property', price: 220, rent_base: 18, rent_1: 90, rent_2: 250, rent_3: 700, rent_4: 875, rent_hotel: 1050, house_cost: 150, color: 'red' },
    { space: 29, name_en: 'Elephant Road', name_bn: 'এলিফ্যান্ট রোড', type: 'property', price: 240, rent_base: 20, rent_1: 100, rent_2: 300, rent_3: 750, rent_4: 925, rent_hotel: 1100, house_cost: 150, color: 'red' },
    
    // Yellow properties
    { space: 32, name_en: 'Kalabagan', name_bn: 'কলাবাগান', type: 'property', price: 260, rent_base: 22, rent_1: 110, rent_2: 330, rent_3: 800, rent_4: 975, rent_hotel: 1150, house_cost: 150, color: 'yellow' },
    { space: 33, name_en: 'New Market', name_bn: 'নিউ মার্কেট', type: 'property', price: 260, rent_base: 22, rent_1: 110, rent_2: 330, rent_3: 800, rent_4: 975, rent_hotel: 1150, house_cost: 150, color: 'yellow' },
    { space: 35, name_en: 'Paltan', name_bn: 'পল্টন', type: 'property', price: 280, rent_base: 24, rent_1: 120, rent_2: 360, rent_3: 850, rent_4: 1025, rent_hotel: 1200, house_cost: 150, color: 'yellow' },
    
    // Green properties
    { space: 37, name_en: 'Shahbag', name_bn: 'শাহবাগ', type: 'property', price: 300, rent_base: 26, rent_1: 130, rent_2: 390, rent_3: 900, rent_4: 1100, rent_hotel: 1275, house_cost: 200, color: 'green' },
    { space: 38, name_en: 'Karwan Bazar', name_bn: 'কারওয়ান বাজার', type: 'property', price: 300, rent_base: 26, rent_1: 130, rent_2: 390, rent_3: 900, rent_4: 1100, rent_hotel: 1275, house_cost: 200, color: 'green' },
    { space: 40, name_en: 'Gulshan-1', name_bn: 'গুলশান-১', type: 'property', price: 320, rent_base: 28, rent_1: 150, rent_2: 450, rent_3: 1000, rent_4: 1200, rent_hotel: 1400, house_cost: 200, color: 'green' },
    
    // Dark blue properties
    { space: 39, name_en: 'Banani', name_bn: 'বনানী', type: 'property', price: 350, rent_base: 35, rent_1: 175, rent_2: 500, rent_3: 1100, rent_4: 1300, rent_hotel: 1500, house_cost: 200, color: 'darkblue' },
    { space: 40, name_en: 'Bashundhara', name_bn: 'বসুন্ধরা', type: 'property', price: 400, rent_base: 50, rent_1: 200, rent_2: 600, rent_3: 1400, rent_4: 1700, rent_hotel: 2000, house_cost: 200, color: 'darkblue' },
    
    // Railroads
    { space: 6, name_en: 'Kamalapur Railway Station', name_bn: 'কমলাপুর রেলওয়ে স্টেশন', type: 'railroad', price: 200, rent_base: 25, color: 'railroad' },
    { space: 16, name_en: 'Bimanbandar Railway Station', name_bn: 'বিমানবন্দর রেলওয়ে স্টেশন', type: 'railroad', price: 200, rent_base: 25, color: 'railroad' },
    { space: 26, name_en: 'Akhataruzzaman Railway Station', name_bn: 'আখতারুজ্জামান রেলওয়ে স্টেশন', type: 'railroad', price: 200, rent_base: 25, color: 'railroad' },
    { space: 36, name_en: 'Hazipur Railway Station', name_bn: 'হাজীপুর রেলওয়ে স্টেশন', type: 'railroad', price: 200, rent_base: 25, color: 'railroad' },
    
    // Utilities
    { space: 13, name_en: 'DESCO', name_bn: 'ডেসকো', type: 'utility', price: 150, rent_base: 4, color: 'utility' },
    { space: 29, name_en: 'WASA', name_bn: 'ওয়াসা', type: 'utility', price: 150, rent_base: 4, color: 'utility' }
  ];

  for (const prop of properties) {
    try {
      db.run(`
        INSERT OR IGNORE INTO properties 
        (space_number, name_en, name_bn, type, price, rent_base, rent_1, rent_2, rent_3, rent_4, rent_hotel, house_cost, color_group)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        prop.space, prop.name_en, prop.name_bn, prop.type, prop.price, prop.rent_base,
        prop.rent_1 || null, prop.rent_2 || null, prop.rent_3 || null, 
        prop.rent_4 || null, prop.rent_hotel || null, prop.house_cost || null, prop.color
      ]);
    } catch {
      // Property might already exist
    }
  }
}

/**
 * Save database to disk
 */
export function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}

/**
 * Get database instance
 */
export function getDatabase() {
  return db;
}

export default {
  initDatabase,
  saveDatabase,
  closeDatabase,
  getDatabase
};
