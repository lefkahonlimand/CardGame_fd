#!/bin/bash

# Card Estimation Game Server Startup Script
# Für Jetson Nano - startet das Spiel und macht es über Internet zugänglich

echo "🚀 Starting Card Estimation Game Server..."

# Gehe zum Projektverzeichnis
GAME_DIR="/home/fd1337/card-estimation-game"
cd "$GAME_DIR" || exit 1

# Prüfe ob Node.js läuft
if pgrep -f "server-express.js" > /dev/null; then
    echo "⚠️  Server already running, stopping old instance..."
    pkill -f "server-express.js"
    sleep 2
fi

# Starte den Game Server im Hintergrund
echo "🎮 Starting game server..."
nohup node server/server-express.js > game-server.log 2>&1 &
SERVER_PID=$!

# Warte kurz bis Server gestartet ist
sleep 3

# Prüfe ob Server erfolgreich gestartet ist
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Game server failed to start!"
    exit 1
fi

echo "✅ Game server started successfully (PID: $SERVER_PID)"
echo "💻 Local access: http://localhost:3000"
echo "📝 Server logs: tail -f $GAME_DIR/game-server.log"

# PID für systemd Service speichern
echo $SERVER_PID > /tmp/card-game.pid
