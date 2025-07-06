# Card Estimation Game 🎮

A multiplayer browser-based card estimation game with real-time communication, perfect for agile planning sessions and fun gaming sessions.

## 🚀 Features

- **Real-time Multiplayer**: Socket.io powered real-time communication
- **Innovative UI**: Floating insertion zones for intuitive card placement
- **Cross-Platform**: Runs on any device with a web browser
- **Easy Deployment**: Optimized for Jetson Nano with internet tunneling via Ngrok
- **LAN & Internet Gaming**: Play locally or over the internet
- **Debug Tools**: Built-in debugging utilities for development

## 🛠️ Technology Stack

- **Backend**: Node.js with Express
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Real-time Communication**: Socket.io
- **Deployment**: Jetson Nano, Ngrok tunneling

## 📦 Installation

### Prerequisites
- Node.js (v12 or higher)
- npm

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/lefkahonlimand/CardGame_fd.git
   cd CardGame_fd
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🖥️ Jetson Nano Deployment

### Setup Scripts
The repository includes convenient scripts for Jetson Nano deployment:

- `start-game-server.sh` - Start the game server
- `stop-game-server.sh` - Stop the game server

### Internet Access via Ngrok
For external access, the setup supports Ngrok tunneling to make your local game available over the internet securely.

## 📁 Project Structure

```
card-estimation-game/
├── client/                 # Frontend files
│   ├── index.html         # Main game interface
│   ├── beta.html          # Beta version interface
│   ├── beta-game.js       # Beta game logic
│   ├── beta-styles.css    # Beta styling
│   ├── debug-utils.js     # Debug utilities
│   └── image-manager.js   # Image handling
├── server/                # Backend files
│   ├── server-express.js  # Main Express server
│   ├── server-fastify.js  # Alternative Fastify server
│   └── cards.json         # Card data
├── docs/                  # Documentation
├── start-game-server.sh   # Start script
├── stop-game-server.sh    # Stop script
└── package.json           # Dependencies
```

## 🎯 Game Versions

- **Alpha Version**: Basic functionality with core game mechanics
- **Beta Version**: Enhanced UI, floating insertion zones, improved user experience

## 🔧 Development

### Debug Mode
The game includes comprehensive debug tools accessible via `debug-utils.js` for development and troubleshooting.

### Testing
```bash
node test-debug.js
```

## 🌐 Network Configuration

### Local Network (LAN)
- Default port: 3000
- Access via: `http://[JETSON_IP]:3000`

### Internet Access
- Uses Ngrok for secure tunneling
- Follow setup instructions in `JETSON_SETUP.md`

## 📖 Documentation

- `README-BETA.md` - Beta version specific information
- `BETA_FIXES_SUMMARY.md` - Recent fixes and improvements
- `DEBUG_GUIDE.md` - Debugging guide
- `JETSON_SETUP.md` - Jetson Nano setup instructions
- `docs/` - Additional documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- **Repository**: https://github.com/lefkahonlimand/CardGame_fd
- **Issues**: https://github.com/lefkahonlimand/CardGame_fd/issues

## 🎮 How to Play

1. Open the game in your browser
2. Enter your player name
3. Wait for other players to join
4. Start estimating with the provided cards
5. Use the floating insertion zones for precise card placement
6. Enjoy real-time multiplayer card estimation!

---

**Developed with ❤️ for agile teams and gaming enthusiasts**
