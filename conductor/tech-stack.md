# Technology Stack

## Overview
A lightweight, performance-focused stack optimized for running on Android devices via Termux while supporting real-time multiplayer gameplay.

---

## Backend

### Runtime: Node.js
- **Version**: Latest (user-managed installation)
- **Justification**: 
  - Excellent Termux support with easy installation
  - Event-driven architecture ideal for real-time game sync
  - Low memory footprint compared to alternatives
  - Large ecosystem of lightweight packages

### Framework: Express.js
- **Version**: 4.x
- **Justification**:
  - Minimal, unopinionated framework
  - Small bundle size (~500KB with dependencies)
  - Easy WebSocket integration for real-time features
  - Well-documented and stable

### Real-Time Communication
- **WebSocket**: `ws` library for bidirectional game state sync
- **Fallback**: Server-Sent Events (SSE) for older browsers
- **Justification**: Low-latency communication essential for multiplayer gameplay

---

## Frontend

### Core: Vanilla JavaScript (ES6+)
- **No Framework**: Zero framework overhead for maximum performance
- **Module System**: ES modules for code organization
- **Justification**:
  - Smallest possible bundle size (<50KB total)
  - No virtual DOM overhead
  - Direct DOM manipulation for fine-tuned performance
  - Compatible with 2016 Android browsers

### Styling: Plain CSS
- **No Preprocessor**: Write standard CSS3
- **No Framework**: Custom lightweight styles only
- **Features**:
  - CSS Grid and Flexbox for layouts
  - CSS Custom Properties (variables) for theming
  - Media queries for portrait/landscape detection
  - Critical CSS inlined for fast first paint

### Build Tool: None (or minimal)
- **Development**: Direct file serving with Express static middleware
- **Optional**: Vite for development server and minimal bundling
- **Justification**: Avoid build complexity, ship files directly

---

## Database

### Primary: SQLite
- **Library**: `better-sqlite3` or `sql.js`
- **Justification**:
  - Single-file database, perfect for mobile storage
  - No separate server process required
  - ACID-compliant for reliable game state persistence
  - Low memory footprint (~500KB)
  - Fast read/write for local operations

### Schema Design
- **Games Table**: Active game sessions, state JSON
- **Players Table**: Registered players, profiles
- **History Table**: Completed games, statistics
- **Sync Table**: Pending sync operations for reconnection

---

## CLI

### Framework: Commander.js
- **Version**: Latest
- **Justification**:
  - Simple, expressive command definition
  - Built-in help and argument parsing
  - Lightweight (~200KB)

### Commands
- `start` - Launch game server
- `setup` - Initialize new game session
- `players` - Manage player roster
- `status` - Show server/game status
- `join` - Join existing game

---

## Development Tools

### Package Manager: npm
- Built into Node.js, no additional installation

### Version Control: Git
- Standard Git workflow

### Testing
- **Backend**: Jest (lightweight mode) or AVA
- **Frontend**: Browser-based manual testing on target devices
- **E2E**: Puppeteer (desktop only for development)

### Linting
- **ESLint**: With minimal ruleset for performance focus

---

## Deployment

### Target Environment
- **OS**: Android 5.0+ via Termux
- **Runtime**: Node.js installed through Termux package manager
- **Storage**: Internal storage or SD card

### Server Configuration
- **Port**: Configurable (default: 3000)
- **Host**: 0.0.0.0 (accessible via hotspot)
- **Process**: Run in background with `termux-wake-lock`

### Performance Budget
- **Memory**: <50MB server + <50MB browser
- **Startup**: <3 seconds to interactive
- **Bundle**: <100KB total (JS + CSS)

---

## Alternative Considerations

### Not Selected
- **React/Vue/Angular**: Too heavy for 512MB RAM constraint
- **MongoDB**: Requires separate process, higher memory
- **PostgreSQL**: Overkill for single-device deployment
- **Python/Flask**: Slower event handling for real-time sync
- **Go/Rust**: Steeper learning curve, limited Termux package support
