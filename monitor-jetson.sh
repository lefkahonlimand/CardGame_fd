#!/bin/bash

echo "=== CARD ESTIMATION GAME - LIVE MONITORING ==="
echo "Datum: $(date)"
echo ""

# Farbdefinitionen
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktion für Service-Status
check_service_status() {
    local service_name=$1
    if systemctl is-active --quiet $service_name; then
        echo -e "${GREEN}✅ $service_name: LÄUFT${NC}"
        echo "    PID: $(systemctl show $service_name -p MainPID --value)"
        echo "    Uptime: $(systemctl show $service_name -p ActiveEnterTimestamp --value | cut -d' ' -f2-3)"
    else
        echo -e "${RED}❌ $service_name: GESTOPPT${NC}"
        echo "    Status: $(systemctl is-active $service_name)"
    fi
}

# System-Info
echo -e "${BLUE}=== SYSTEM OVERVIEW ===${NC}"
echo "Hostname: $(hostname)"
echo "Uptime: $(uptime -p)"
echo "Load: $(uptime | awk -F'load average:' '{print $2}')"
echo "Memory: $(free -h | awk '/^Mem:/ {printf "%s/%s (%.1f%%)", $3, $2, ($3/$2)*100}')"
echo "Disk: $(df -h / | awk 'NR==2 {printf "%s/%s (%s)", $3, $2, $5}')"
echo ""

# Service Status
echo -e "${BLUE}=== SERVICE STATUS ===${NC}"
check_service_status "card-game"
echo ""
check_service_status "ngrok"
echo ""

# Port Status
echo -e "${BLUE}=== PORT STATUS ===${NC}"
if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    echo -e "${GREEN}✅ Port 3000: LISTENING${NC}"
    PROCESS_3000=$(netstat -tlnp 2>/dev/null | grep ":3000" | awk '{print $7}' | cut -d'/' -f2)
    echo "    Prozess: $PROCESS_3000"
else
    echo -e "${RED}❌ Port 3000: NICHT LISTENING${NC}"
fi

if netstat -tlnp 2>/dev/null | grep -q ":4040"; then
    echo -e "${GREEN}✅ Port 4040 (ngrok): LISTENING${NC}"
else
    echo -e "${RED}❌ Port 4040 (ngrok): NICHT LISTENING${NC}"
fi
echo ""

# HTTP Health Check
echo -e "${BLUE}=== HTTP HEALTH CHECK ===${NC}"
if command -v curl &> /dev/null; then
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 --max-time 5 || echo "000")
    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo -e "${GREEN}✅ Game Server HTTP: OK (Status: $HTTP_STATUS)${NC}"
        
        # Response Time testen
        RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:3000 --max-time 5 || echo "timeout")
        echo "    Response Time: ${RESPONSE_TIME}s"
        
    else
        echo -e "${RED}❌ Game Server HTTP: FEHLER (Status: $HTTP_STATUS)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  curl nicht verfügbar - HTTP-Test übersprungen${NC}"
fi
echo ""

# Ngrok Status und URL
echo -e "${BLUE}=== NGROK STATUS ===${NC}"
if systemctl is-active --quiet ngrok; then
    # Ngrok URL abrufen
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "import sys,json; data=json.load(sys.stdin); print(data['tunnels'][0]['public_url'] if data['tunnels'] else 'Keine URL')" 2>/dev/null || echo "URL-Abruf fehlgeschlagen")
    
    if [ "$NGROK_URL" != "Keine URL" ] && [ "$NGROK_URL" != "URL-Abruf fehlgeschlagen" ]; then
        echo -e "${GREEN}✅ Ngrok Tunnel: AKTIV${NC}"
        echo -e "${BLUE}🌐 Öffentliche URL: $NGROK_URL${NC}"
        
        # External HTTP Test
        echo "Teste externe Erreichbarkeit..."
        EXTERNAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$NGROK_URL" --max-time 10 || echo "000")
        if [ "$EXTERNAL_STATUS" -eq 200 ]; then
            echo -e "${GREEN}✅ Externe Erreichbarkeit: OK${NC}"
        else
            echo -e "${RED}❌ Externe Erreichbarkeit: FEHLER (Status: $EXTERNAL_STATUS)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Ngrok läuft, aber keine URL verfügbar${NC}"
    fi
else
    echo -e "${RED}❌ Ngrok Service nicht aktiv${NC}"
fi
echo ""

# Git Status
echo -e "${BLUE}=== GIT STATUS ===${NC}"
cd /home/fd1337/card-estimation-game
echo "Repository: $(pwd)"
echo "Branch: $(git branch --show-current)"
echo "Letzter Commit: $(git log -1 --format='%h %s (%ar)')"

# Prüfen ob Updates verfügbar
git fetch origin &>/dev/null
UPDATES=$(git rev-list HEAD..origin/main --count 2>/dev/null || git rev-list HEAD..origin/master --count 2>/dev/null || echo "0")
if [ "$UPDATES" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $UPDATES Updates verfügbar${NC}"
else
    echo -e "${GREEN}✅ Repository ist aktuell${NC}"
fi
echo ""

# Letzte Logs
echo -e "${BLUE}=== AKTUELLE LOGS (letzte 5 Zeilen) ===${NC}"
echo "Card Game Service:"
sudo journalctl -u card-game -n 5 --no-pager | sed 's/^/  /'
echo ""
echo "Ngrok Service:"
sudo journalctl -u ngrok -n 5 --no-pager | sed 's/^/  /'
echo ""

# Prozess-Übersicht
echo -e "${BLUE}=== AKTIVE PROZESSE ===${NC}"
echo "Card Game Prozesse:"
ps aux | grep -E "(node|npm|card-game)" | grep -v grep | sed 's/^/  /'
echo ""
echo "Ngrok Prozesse:"
ps aux | grep ngrok | grep -v grep | sed 's/^/  /'
echo ""

# Quick Actions
echo -e "${BLUE}=== QUICK ACTIONS ===${NC}"
echo "Nützliche Befehle:"
echo "  🔄 Services neu starten:"
echo "    sudo systemctl restart card-game"
echo "    sudo systemctl restart ngrok"
echo ""
echo "  📋 Logs live verfolgen:"
echo "    sudo journalctl -u card-game -f"
echo "    sudo journalctl -u ngrok -f"
echo ""
echo "  🔍 Detaillierte Service-Info:"
echo "    sudo systemctl status card-game"
echo "    sudo systemctl status ngrok"
echo ""
echo "  🌐 Aktuelle Ngrok URL:"
echo "    curl -s http://localhost:4040/api/tunnels | python3 -m json.tool"
echo ""

# Letzte Update-Zeit
echo -e "${GREEN}=== MONITORING ABGESCHLOSSEN ===${NC}"
echo "Letztes Update: $(date)"
echo ""

# Optional: Kontinuierliches Monitoring
read -p "Kontinuierliches Monitoring starten? (j/N): " CONTINUOUS
if [ "$CONTINUOUS" = "j" ] || [ "$CONTINUOUS" = "J" ]; then
    echo ""
    echo "Drücken Sie Ctrl+C zum Beenden..."
    echo ""
    
    while true; do
        clear
        echo "=== LIVE MONITORING ($(date)) ==="
        echo ""
        
        # Nur wichtigste Infos
        check_service_status "card-game"
        check_service_status "ngrok"
        echo ""
        
        if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
            echo -e "${GREEN}✅ Game Server: ONLINE${NC}"
        else
            echo -e "${RED}❌ Game Server: OFFLINE${NC}"
        fi
        
        NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "import sys,json; data=json.load(sys.stdin); print(data['tunnels'][0]['public_url'] if data['tunnels'] else 'Keine URL')" 2>/dev/null || echo "URL-Abruf fehlgeschlagen")
        if [ "$NGROK_URL" != "Keine URL" ] && [ "$NGROK_URL" != "URL-Abruf fehlgeschlagen" ]; then
            echo -e "${GREEN}✅ Ngrok: $NGROK_URL${NC}"
        else
            echo -e "${RED}❌ Ngrok: OFFLINE${NC}"
        fi
        
        echo ""
        echo "Aktualisierung in 30 Sekunden... (Ctrl+C zum Beenden)"
        sleep 30
    done
fi
