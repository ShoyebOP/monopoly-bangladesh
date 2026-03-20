# Monopoly Bangladesh 🇧🇩

A lightweight, web-based Monopoly game optimized for low-end Android devices (512MB RAM, 2016+), featuring Bangladeshi cities, language, and cultural themes.

## Features

- 🎯 **Lightweight**: Runs on 2016 Android phones with 512MB RAM
- 🌐 **Offline-First**: No internet required, runs via local hotspot
- 🇧🇩 **Localized**: Bangla city names, currency (৳), and cultural themes
- 📱 **Mobile-First**: Separate UI for portrait and landscape orientations
- 🖥️ **CLI Management**: Server and game control via command line

## Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: Vanilla JavaScript + CSS (no frameworks)
- **Database**: SQLite
- **Real-time**: WebSocket (ws library)
- **CLI**: Commander.js

## Requirements

- Node.js (latest)
- Android 5.0+ (for Termux deployment)
- Modern browser (Chrome, Firefox, Samsung Internet)

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or development mode with auto-reload
npm run dev
```

## CLI Commands

```bash
# Start game server
node cli/start.js

# Setup players
node cli/setup.js

# List players
node cli/players.js

# Show server status
node cli/status.js
```

## Project Structure

```
monopoly-bangladesh/
├── src/          # Server-side code
├── public/       # Frontend files (HTML, CSS, JS)
├── cli/          # CLI commands
├── db/           # Database files
├── tests/        # Test files
├── docs/         # Documentation
└── conductor/    # Project management (Conductor methodology)
```

## Documentation

- [Monopoly Rules](docs/monopoly-rules.md)
- [Board Spaces](docs/board-spaces.md)
- [Chance Cards](docs/chance-cards.md)
- [Community Chest Cards](docs/community-chest-cards.md)
- [Bangladesh Localization](docs/bangladesh-localization.md)

## Development

```bash
# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## License

MIT
