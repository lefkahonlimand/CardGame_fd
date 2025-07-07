#!/bin/bash

# Jetson Service Setup Script
# Erstellt systemd Service für dauerhaften Betrieb

echo "🚀 Jetson Nano Dauerbetrieb Setup"
echo "================================="

# Service-Datei erstellen
cat > /tmp/card-game.service << 'EOF'
[Unit]
Description=Card Estimation Game
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/jetson/card-estimation-game
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0
User=jetson
Group=jetson

[Install]
WantedBy=multi-user.target
EOF

echo "📁 Service-Datei erstellt"

echo "📋 Nächste Schritte auf dem Jetson:"
echo "1. sudo cp /tmp/card-game.service /etc/systemd/system/"
echo "2. sudo systemctl daemon-reload"
echo "3. sudo systemctl enable card-game"
echo "4. sudo systemctl start card-game"
echo ""
echo "📊 Status prüfen:"
echo "sudo systemctl status card-game"
echo ""
echo "🔄 Service-Befehle:"
echo "sudo systemctl start card-game    # Starten"
echo "sudo systemctl stop card-game     # Stoppen"
echo "sudo systemctl restart card-game  # Neustarten"
echo "sudo systemctl status card-game   # Status"
