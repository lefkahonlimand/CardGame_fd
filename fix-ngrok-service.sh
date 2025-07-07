#!/bin/bash

echo "=== NGROK SERVICE REPARATUR ==="
echo ""

# Zuerst den Service stoppen falls er läuft
echo "Stoppe ngrok Service..."
sudo systemctl stop ngrok 2>/dev/null

# Die korrigierte Service-Datei installieren
echo "Installiere korrigierte ngrok.service..."
sudo cp ngrok.service /etc/systemd/system/
sudo systemctl daemon-reload

echo ""
echo "✅ Service-Datei wurde aktualisiert!"
echo ""

# Jetzt den authtoken einrichten
echo "Jetzt wird der ngrok authtoken eingerichtet..."
echo "Sie benötigen Ihren ngrok authtoken von: https://dashboard.ngrok.com/get-started/your-authtoken"
echo ""

# Das Token-Setup Script ausführen
chmod +x setup-ngrok-token.sh
dos2unix setup-ngrok-token.sh
./setup-ngrok-token.sh

if [ $? -eq 0 ]; then
    echo ""
    echo "=== NGROK SERVICE SETUP ABGESCHLOSSEN ==="
    echo ""
    echo "Jetzt können Sie den ngrok Service starten:"
    echo "  sudo systemctl start ngrok"
    echo "  sudo systemctl enable ngrok"
    echo ""
    echo "Status prüfen:"
    echo "  sudo systemctl status ngrok"
    echo ""
    echo "Logs anzeigen:"
    echo "  sudo journalctl -u ngrok -f"
else
    echo ""
    echo "❌ Fehler beim Token-Setup"
    echo "Bitte führen Sie das Token-Setup manuell aus:"
    echo "  ./setup-ngrok-token.sh"
fi
