#!/bin/bash

echo "=== CARD ESTIMATION GAME - DEPLOYMENT TO JETSON ==="
echo "Datum: $(date)"
echo ""

# Farbdefinitionen für bessere Lesbarkeit
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Konfiguration
PROJECT_DIR="/home/fd1337/card-estimation-game"
BACKUP_DIR="/home/fd1337/backups/card-game-$(date +%Y%m%d-%H%M%S)"
SERVICE_NAME="card-game"

echo -e "${BLUE}=== 1. PRE-DEPLOYMENT CHECKS ===${NC}"

# Prüfen ob Services laufen
echo "Aktueller Service Status:"
sudo systemctl status $SERVICE_NAME --no-pager | head -3
echo ""

# Backup erstellen
echo -e "${YELLOW}=== 2. BACKUP ERSTELLEN ===${NC}"
echo "Erstelle Backup in: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
cp -r "$PROJECT_DIR" "$BACKUP_DIR/" 2>/dev/null || echo "Backup-Warnung: Einige Dateien konnten nicht kopiert werden"
echo -e "${GREEN}✅ Backup erstellt${NC}"
echo ""

# Service stoppen
echo -e "${YELLOW}=== 3. SERVICES STOPPEN ===${NC}"
echo "Stoppe $SERVICE_NAME Service..."
sudo systemctl stop $SERVICE_NAME
sleep 2

# Status prüfen
if systemctl is-active --quiet $SERVICE_NAME; then
    echo -e "${RED}❌ Service läuft noch! Deployment abgebrochen.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Service gestoppt${NC}"
fi
echo ""

# Git Status prüfen
echo -e "${YELLOW}=== 4. GIT UPDATE ===${NC}"
cd "$PROJECT_DIR"

echo "Aktueller Git Status:"
git status --porcelain

echo ""
echo "Hole neueste Änderungen vom Remote Repository..."
git fetch origin

# Prüfen ob Updates verfügbar
UPDATES=$(git rev-list HEAD..origin/main --count 2>/dev/null || git rev-list HEAD..origin/master --count 2>/dev/null || echo "0")

if [ "$UPDATES" -gt 0 ]; then
    echo -e "${BLUE}📦 $UPDATES neue Commits verfügbar${NC}"
    echo "Neueste Commits:"
    git log --oneline -5 origin/main..HEAD 2>/dev/null || git log --oneline -5 origin/master..HEAD 2>/dev/null || echo "Keine neuen Commits"
    echo ""
    
    echo "Führe Git Pull durch..."
    git pull origin main 2>/dev/null || git pull origin master 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Git Update erfolgreich${NC}"
    else
        echo -e "${RED}❌ Git Update fehlgeschlagen${NC}"
        echo "Starte Service wieder..."
        sudo systemctl start $SERVICE_NAME
        exit 1
    fi
else
    echo -e "${GREEN}✅ Repository ist bereits aktuell${NC}"
fi
echo ""

# Dependencies prüfen und installieren
echo -e "${YELLOW}=== 5. DEPENDENCIES UPDATE ===${NC}"
if [ -f "package.json" ]; then
    echo "Prüfe Node.js Dependencies..."
    
    # Prüfen ob package-lock.json geändert wurde
    if git diff --name-only HEAD~1 | grep -q "package.*\.json"; then
        echo -e "${BLUE}📦 Package.json wurde geändert - installiere Dependencies${NC}"
        npm ci
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Dependencies aktualisiert${NC}"
        else
            echo -e "${RED}❌ Dependency-Installation fehlgeschlagen${NC}"
            sudo systemctl start $SERVICE_NAME
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Keine Dependency-Änderungen${NC}"
    fi
fi
echo ""

# Build-Prozess (falls nötig)
echo -e "${YELLOW}=== 6. BUILD PROZESS ===${NC}"
if [ -f "package.json" ]; then
    # Prüfen ob Build-Script existiert
    if npm run | grep -q "build"; then
        echo "Führe Build-Prozess durch..."
        npm run build
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Build erfolgreich${NC}"
        else
            echo -e "${RED}❌ Build fehlgeschlagen${NC}"
            sudo systemctl start $SERVICE_NAME
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Kein Build-Prozess erforderlich${NC}"
    fi
fi
echo ""

# Konfigurationsdateien prüfen
echo -e "${YELLOW}=== 7. KONFIGURATION PRÜFEN ===${NC}"
if [ -f ".env.example" ] && [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env Datei fehlt - erstelle aus .env.example${NC}"
    cp .env.example .env
    echo "Bitte .env Datei manuell anpassen falls nötig"
fi

# Berechtigungen setzen
echo "Setze korrekte Berechtigungen..."
chmod +x start-game-server.sh stop-game-server.sh 2>/dev/null
chmod 644 *.json *.md 2>/dev/null
echo -e "${GREEN}✅ Berechtigungen gesetzt${NC}"
echo ""

# Service starten
echo -e "${YELLOW}=== 8. SERVICE STARTEN ===${NC}"
echo "Starte $SERVICE_NAME Service..."
sudo systemctl start $SERVICE_NAME
sleep 3

# Service Status prüfen
if systemctl is-active --quiet $SERVICE_NAME; then
    echo -e "${GREEN}✅ Service erfolgreich gestartet${NC}"
else
    echo -e "${RED}❌ Service-Start fehlgeschlagen${NC}"
    echo "Service Status:"
    sudo systemctl status $SERVICE_NAME --no-pager
    echo ""
    echo "Letzte Logs:"
    sudo journalctl -u $SERVICE_NAME -n 10 --no-pager
    exit 1
fi
echo ""

# Health Check
echo -e "${YELLOW}=== 9. HEALTH CHECK ===${NC}"
echo "Warte auf Service-Bereitschaft..."
sleep 5

# Port-Check
if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    echo -e "${GREEN}✅ Service lauscht auf Port 3000${NC}"
else
    echo -e "${RED}❌ Service lauscht nicht auf Port 3000${NC}"
fi

# HTTP-Check (falls curl verfügbar)
if command -v curl &> /dev/null; then
    echo "Teste HTTP-Antwort..."
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo -e "${GREEN}✅ HTTP-Service antwortet (Status: $HTTP_STATUS)${NC}"
    else
        echo -e "${YELLOW}⚠️  HTTP-Service Status: $HTTP_STATUS${NC}"
    fi
fi
echo ""

# Ngrok Status prüfen
echo -e "${YELLOW}=== 10. NGROK STATUS ===${NC}"
if systemctl is-active --quiet ngrok; then
    echo -e "${GREEN}✅ Ngrok Service läuft${NC}"
    
    # Ngrok URL abrufen
    sleep 2
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "import sys,json; data=json.load(sys.stdin); print(data['tunnels'][0]['public_url'] if data['tunnels'] else 'Keine URL')" 2>/dev/null || echo "URL-Abruf fehlgeschlagen")
    
    if [ "$NGROK_URL" != "Keine URL" ] && [ "$NGROK_URL" != "URL-Abruf fehlgeschlagen" ]; then
        echo -e "${BLUE}🌐 Öffentliche URL: $NGROK_URL${NC}"
    else
        echo -e "${YELLOW}⚠️  Ngrok URL konnte nicht abgerufen werden${NC}"
    fi
else
    echo -e "${RED}❌ Ngrok Service läuft nicht${NC}"
    echo "Starte Ngrok Service..."
    sudo systemctl start ngrok
fi
echo ""

# Deployment Summary
echo -e "${GREEN}=== DEPLOYMENT ABGESCHLOSSEN ===${NC}"
echo -e "${GREEN}🎉 Card Estimation Game wurde erfolgreich aktualisiert!${NC}"
echo ""
echo "📊 Deployment-Zusammenfassung:"
echo "  • Backup erstellt: $BACKUP_DIR"
echo "  • Git Updates: $([ "$UPDATES" -gt 0 ] && echo "$UPDATES Commits" || echo "Keine")"
echo "  • Service Status: $(systemctl is-active $SERVICE_NAME)"
echo "  • Ngrok Status: $(systemctl is-active ngrok)"
echo ""
echo "🔧 Nützliche Befehle für Monitoring:"
echo "  • Logs verfolgen: sudo journalctl -u $SERVICE_NAME -f"
echo "  • Service Status: sudo systemctl status $SERVICE_NAME"
echo "  • Ngrok URL: curl -s http://localhost:4040/api/tunnels | python3 -m json.tool"
echo ""

# Optional: Deployment-Benachrichtigung
if command -v wall &> /dev/null; then
    echo "Card Estimation Game wurde erfolgreich aktualisiert! $(date)" | wall 2>/dev/null
fi

echo -e "${GREEN}✅ Deployment erfolgreich abgeschlossen!${NC}"
