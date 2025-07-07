#!/bin/bash

# Ngrok Service Setup Script
# Erstellt systemd Service für ngrok Dauerbetrieb

echo "🌐 Ngrok Dauerbetrieb Setup"
echo "==========================="

# Service-Datei erstellen
cat > /tmp/ngrok.service << 'EOF'
[Unit]
Description=Ngrok HTTP Tunnel
After=network.target card-game.service

[Service]
Type=simple
User=jetson
Group=jetson
Restart=always
RestartSec=10
ExecStart=/usr/local/bin/ngrok http 3000 --authtoken-from-env
Environment=NGROK_AUTHTOKEN=YOUR_AUTHTOKEN_HERE
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "📁 Ngrok Service-Datei erstellt"

echo "📋 Nächste Schritte auf dem Jetson:"
echo "1. Ngrok Authtoken setzen:"
echo "   ngrok authtoken YOUR_ACTUAL_TOKEN"
echo ""
echo "2. Service installieren:"
echo "   sudo cp /tmp/ngrok.service /etc/systemd/system/"
echo "   sudo systemctl daemon-reload"
echo "   sudo systemctl enable ngrok"
echo "   sudo systemctl start ngrok"
echo ""
echo "📊 Status und URL prüfen:"
echo "sudo systemctl status ngrok"
echo "sudo journalctl -u ngrok -f"
echo ""
echo "🔄 Service-Befehle:"
echo "sudo systemctl start ngrok     # Starten"
echo "sudo systemctl stop ngrok      # Stoppen"
echo "sudo systemctl restart ngrok   # Neustarten"
echo ""
echo "🌐 Ngrok URL abrufen:"
echo "curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'"
