# Product Requirements

## User Stories

### Host (Server Admin)
- As a host, I want to set up and manage the game server via CLI so that I can control game sessions without using the web interface
- As a host, I want to pre-configure player profiles via CLI so that joining players can select from existing players
- As a host, I want to start/stop game sessions and monitor connected players so that I can manage the game flow

### Join Player
- As a player, I want to open the web app in my browser and immediately see available games so that I can join without complex setup
- As a player, I want to select from pre-configured players so that I can quickly start playing
- As a player, I want to see a simple menu interface so that I can understand my options without tutorials

### Gameplay
- As a player, I want to roll dice and move around the board so that I can play Monopoly
- As a player, I want to buy properties when I land on them so that I can build my portfolio
- As a player, I want to see my money, properties, and game state so that I can make informed decisions

---

## Functional Requirements

### MVP Core Features (Phase 1)
1. **Core Gameplay Loop**
   - Dice rolling mechanism (1-6 random values)
   - Player movement around the board (sequential spaces)
   - Property buying system (purchase when landing on unowned spaces)
   - Basic turn management (alternating between players)
   - Win/lose condition detection

2. **Board Configuration**
   - Bangla city names for all properties (8 divisions of Bangladesh)
   - Bangla numerals for currency display (৳)
   - Corner squares with basic functionality (Go, Jail, Parking, Go To Jail)
   - Property cards showing purchase price and rent

3. **Player Selection**
   - Pre-configured player list loaded from server
   - Simple menu to select available player
   - Visual indication of selected player
   - Prevent selection of already-taken players

4. **CLI Management**
   - `start` - Launch game server
   - `setup` - Create/modify player roster
   - `players` - List configured players
   - `status` - Show active games and connected players

### Save/Load System (Phase 2)
- Auto-save game state after every action
- SQLite database for persistence
- Game recovery on browser refresh
- Host-controlled game reset/delete

### Multiplayer Sync (Phase 2)
- WebSocket-based real-time updates
- Player connection/disconnection handling
- Turn notifications to active player
- Game state synchronization across browsers

---

## Non-Functional Requirements

### Performance Constraints
- **Memory**: Browser usage must stay under 50MB RAM
- **Load Time**: Initial page load under 3 seconds on 3G
- **Bundle Size**: Total JS + CSS under 100KB
- **Sync Latency**: Game state updates under 500ms on local network

### Device Support
- **Minimum**: Android 5.0 (Lollipop), 512MB RAM, 2016+ devices
- **Browsers**: Chrome (primary), Firefox, Samsung Internet
- **Screen Sizes**: 320px width minimum, portrait and landscape layouts

### Offline-First
- No internet connection required
- All assets served locally from Termux server
- Hotspot-based局域网 access only
- Graceful handling of connection drops

### Language Requirements
- **Bangla**: Board spaces, city names, currency amounts, property cards
- **English**: Menus, buttons, notifications, error messages, CLI output

### Usability Standards
- Touch targets minimum 44x44px
- No tutorial required for basic gameplay
- Clear visual feedback for all actions
- Intuitive player selection flow

---

## Technical Constraints

### Server Environment
- Runs on Android phone via Termux
- Node.js (latest, user-managed)
- Single-device deployment (no cloud)
- Minimal battery consumption

### Client Environment
- Vanilla JavaScript only (no frameworks)
- Plain CSS (no preprocessors)
- No build step required
- ES6+ with backward compatibility

### Data Storage
- SQLite database (single file)
- JSON-based game state serialization
- Automatic backup on game state changes

---

## Success Criteria

### MVP Acceptance Tests
1. ✅ Host can start server via CLI on Android phone
2. ✅ Host can configure 4-6 players via CLI
3. ✅ Player can open browser, select a player, and start game
4. ✅ Players can roll dice, move, and buy properties
5. ✅ Game runs smoothly on 2016 Android device with 512MB RAM
6. ✅ All board text displays in Bangla with correct numerals
7. ✅ Game state persists after browser refresh
8. ✅ Two players can complete a full game session

### Performance Benchmarks
- Page load: <3s on 3G simulation
- Memory usage: <50MB in Chrome DevTools
- Bundle size: <100KB total
- First interactive: <2s after load
