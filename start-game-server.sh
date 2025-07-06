#!/bin/bash

# Card Estimation Game Server Startup Script
# Für Jetson Nano - startet das Spiel und macht es über Internet zugänglich

echo "🚀 Starting Card Estimation Game Server..."

# Gehe zum Projektverzeichnis
GAME_DIR="/home/jetson/card-estimation-game"
cd "$GAME_DIR" || exit 1

# Prüfe ob Node.js läuft
if pgrep -f "server-express.js" > /dev/null; then
    echo "⚠️  Server already running, stopping old instance..."
    pkill -f "server-express.js"
    sleep 2
fi

# Prüfe ob Ngrok läuft
if pgrep -f "ngrok" > /dev/null; then
    echo "⚠️  Ngrok already running, stopping old instance..."
    pkill -f "ngrok"
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

# Starte Ngrok Tunnel
echo "🌐 Creating internet tunnel with Ngrok..."
nohup ngrok http 3000 --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!

# Warte bis Ngrok bereit ist
sleep 5

# Hole die öffentliche URL
PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok\.io')

if [ -n "$PUBLIC_URL" ]; then
    echo ""
    echo "🎉 GAME SERVER IS READY!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 Share this URL with your friends:"
    echo "🔗 $PUBLIC_URL"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📝 Server logs: tail -f $GAME_DIR/game-server.log"
    echo "🌐 Ngrok logs: tail -f $GAME_DIR/ngrok.log"
    echo "🛑 Stop server: $GAME_DIR/stop-game-server.sh"
    echo ""
    
    # Speichere URL für einfachen Zugriff
    echo "$PUBLIC_URL" > current-game-url.txt
    
else
    echo "❌ Failed to get public URL from Ngrok"
    echo "📋 Check Ngrok logs: cat ngrok.log"
fi

echo "🎮 Game server is running in background..."
echo "💻 Local access: http://localhost:3000"
