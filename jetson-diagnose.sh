#!/bin/bash

# Jetson Service Diagnose Script
# Analysiert Service-Probleme und sammelt Informationen

echo "🔍 Jetson Service Diagnose"
echo "=========================="

echo "📊 System Information:"
echo "User: $(whoami)"
echo "Home: $HOME"
echo "Working Directory: $(pwd)"

echo ""
echo "📁 Projektverzeichnis prüfen:"
echo "Suche nach docker-compose.yml:"
find $HOME -name "docker-compose.yml" 2>/dev/null

echo ""
echo "🐳 Docker prüfen:"
which docker
which docker-compose
docker --version 2>/dev/null || echo "Docker nicht verfügbar"
docker-compose --version 2>/dev/null || echo "Docker-Compose nicht verfügbar"

echo ""
echo "📋 Service Status:"
sudo systemctl status card-game --no-pager -l
echo ""
echo "📋 Service Logs:"
sudo journalctl -u card-game -n 10 --no-pager

echo ""
echo "📄 Service-Datei Inhalt:"
cat /etc/systemd/system/card-game.service

echo ""
echo "🔧 Berechtigungen prüfen:"
ls -la /etc/systemd/system/card-game.service
ls -la $HOME/card-estimation-game/ 2>/dev/null || echo "Verzeichnis nicht gefunden"
