#!/bin/bash

# Card Estimation Game Server Stop Script
# Für Jetson Nano - stoppt Game Server und Ngrok

echo "🛑 Stopping Card Estimation Game Server..."

# Stoppe Game Server
if pgrep -f "server-express.js" > /dev/null; then
    echo "🎮 Stopping game server..."
    pkill -f "server-express.js"
    echo "✅ Game server stopped"
else
    echo "ℹ️  Game server was not running"
fi

# Stoppe Ngrok
if pgrep -f "ngrok" > /dev/null; then
    echo "🌐 Stopping Ngrok tunnel..."
    pkill -f "ngrok"
    echo "✅ Ngrok tunnel stopped"
else
    echo "ℹ️  Ngrok was not running"
fi

# Lösche URL file
if [ -f "current-game-url.txt" ]; then
    rm current-game-url.txt
    echo "🗑️  Cleaned up URL file"
fi

echo "✅ All services stopped successfully!"
