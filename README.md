# Bomb Arena

A real-time multiplayer Bomberman-style game built with Phaser 3 and Socket.IO.

## Overview

Bomb Arena is a classic arcade-style multiplayer game where players compete to be the last one standing. Place bombs strategically, collect power-ups, and outmaneuver your opponents across multiple rounds in an explosive battle arena!

## Features

### Gameplay
- **Real-time Multiplayer**: Up to 6 players can compete in the same game
- **Best of 3 Rounds**: Win 2 rounds to claim victory, with tiebreaker rounds if needed
- **Power-ups**: Collect items to increase bomb capacity, explosion strength, and movement speed
- **Multiple Maps**: Various arena layouts with destructible blocks

### Visual Effects
- **Particle Systems**: Explosions with fire/smoke effects, confetti celebrations, and sparkle effects
- **Dynamic Lighting**: Atmospheric gradients and ambient lighting overlays
- **Animations**: Victory celebrations with jumping and spinning characters
- **Glow Effects**: Bombs and power-ups feature pulsing glow animations
- **Shadows**: Dynamic shadows that follow players and bombs
- **Screen Shake**: Camera effects during explosions

### Technical Features
- **Client-Side Prediction**: Smooth player movement with server reconciliation
- **Interpolation**: Remote players smoothly interpolate between positions
- **Room-Based Networking**: Isolated game sessions using Socket.IO rooms
- **Phaser 3 Game Engine**: Modern WebGL rendering with fallback to Canvas

## Prerequisites

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/bomb-arena.git
cd bomb-arena
```

2. Install dependencies:
```bash
npm install
```

3. Compile the client code:
```bash
npx gulp compile
```

## Running the Game

### Start the Server

```bash
npm start
```

The server will start on port 8007 (configurable via `process.env.PORT`).

### Access the Game

Open your browser and navigate to:
```
http://localhost:8007
```

### Multiplayer Setup

- Players connect to the same server URL
- Create or join a game lobby
- Select a map
- Start the game when all players are ready

## Project Structure

```
bomb-arena/
├── client/                 # Client-side code
│   ├── src/
│   │   ├── game/
│   │   │   ├── entities/   # Player, Bomb, RemotePlayer classes
│   │   │   ├── states/     # Game scenes (Boot, Preloader, Level, etc.)
│   │   │   └── util/       # Helper utilities
│   │   └── index.html
│   └── dist/               # Compiled client bundle
├── server/                 # Server-side code
│   ├── entities/           # Game, Player, Bomb, Map classes
│   ├── server.js           # Main server entry point
│   └── lobby.js            # Lobby management
├── common/                 # Shared code between client/server
│   ├── map_info.js
│   └── powerup_ids.js
├── assets/                 # Game assets (sprites, tilemaps, audio)
├── gulpfile.js            # Build configuration
└── package.json
```

## Game Controls

- **Arrow Keys**: Move your character
- **Spacebar**: Place a bomb

## Game Rules

### Round Structure
- Games consist of 3 rounds (best of 3)
- Win 2 rounds to win the game
- Tiebreaker rounds played if needed

### Winning Conditions
- Be the last player standing in a round to win that round
- If all remaining players die simultaneously, it's a tie

### Power-ups
- **Bomb Capacity** (blue): Place more bombs simultaneously
- **Bomb Strength** (red): Increase explosion range
- **Speed** (green): Move faster

## Development

### Build Client Code

```bash
npx gulp compile
```

This bundles all client JavaScript using Browserify and writes to `client/dist/bomb_arena.min.js`.

### Watch Mode

For development, you can set up a watch task to automatically recompile on changes.

### Server Development

The server uses Node.js with Express and Socket.IO. Modify files in the `server/` directory and restart the server to see changes.

## Technologies Used

### Client
- **Phaser 3.90.0**: Game engine
- **Socket.IO Client**: Real-time communication
- **Browserify**: Module bundling

### Server
- **Node.js**: Runtime environment
- **Express**: Web server
- **Socket.IO**: WebSocket communication

## Architecture

### Client-Server Model
- **Authoritative Server**: All game logic runs on the server
- **Client Prediction**: Clients predict local player movement for responsiveness
- **Server Reconciliation**: Server validates and corrects client predictions
- **Broadcasting**: Server broadcasts game state updates every 100ms

### Networking
- **Socket.IO**: Handles WebSocket connections with fallback to polling
- **Room-Based**: Each game runs in an isolated Socket.IO room
- **Event-Driven**: Game state changes communicated via named events

## Known Issues

- Tilemap warning: "Image tile area not tile size multiple" (cosmetic, doesn't affect gameplay)
- Server crash possible on rapid disconnect/reconnect (mitigated with null checks)

## Future Enhancements

- [ ] Add more maps
- [ ] Implement additional power-up types
- [ ] Add spectator mode
- [ ] Create tournament bracket system
- [ ] Add replay system
- [ ] Implement chat system
- [ ] Add sound effects toggle
- [ ] Mobile touch controls

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

- Game concept inspired by classic Bomberman
- Built with Phaser 3 game engine
- Multiplayer functionality powered by Socket.IO

## Contact

Project Link: [https://github.com/yourusername/bomb-arena](https://github.com/yourusername/bomb-arena)

---

**Enjoy the game!** May the best bomber win!
