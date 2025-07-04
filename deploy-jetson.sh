#!/bin/bash

# Deployment Script für Jetson Nano
echo "🚀 Card Estimation Game - Jetson Nano Deployment"

# System Information
echo "📋 System Check..."
echo "Architecture: $(uname -m)"
echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"

# Node.js Version prüfen
echo "🔍 Node.js Version:"
node --version || echo "❌ Node.js nicht installiert!"

# NPM Version prüfen  
echo "📦 NPM Version:"
npm --version || echo "❌ NPM nicht installiert!"

# PM2 prüfen/installieren
echo "⚙️  PM2 Check..."
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 bereits installiert: $(pm2 --version)"
else
    echo "📥 PM2 wird installiert..."
    npm install -g pm2
fi

# Abhängigkeiten installieren
echo "📦 Dependencies installieren..."
npm install --production

# Logs Verzeichnis erstellen
echo "📁 Logs Verzeichnis erstellen..."
mkdir -p logs

# Port Check
echo "🔍 Port 3000 Check..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3000 ist bereits belegt!"
    echo "Möchten Sie den bestehenden Prozess beenden? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        pm2 stop card-estimation-game 2>/dev/null || true
        pm2 delete card-estimation-game 2>/dev/null || true
    fi
else
    echo "✅ Port 3000 ist verfügbar"
fi

# Anwendung starten
echo "🚀 Anwendung wird gestartet..."
pm2 start ecosystem.config.js

# Status anzeigen
echo "📊 PM2 Status:"
pm2 status

# IP Adresse ermitteln
IP=$(hostname -I | awk '{print $1}')
echo ""
echo "🎉 Deployment erfolgreich!"
echo "🌐 Anwendung verfügbar unter:"
echo "   Local:    http://localhost:3000"
echo "   Network:  http://$IP:3000"
echo ""
echo "📋 Nützliche Befehle:"
echo "   pm2 logs card-estimation-game  # Logs anzeigen"
echo "   pm2 restart card-estimation-game  # Neustart"
echo "   pm2 stop card-estimation-game     # Stoppen"
echo "   pm2 delete card-estimation-game   # Entfernen"
echo ""
echo "✅ Ready to play!"
