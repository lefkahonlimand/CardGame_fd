#!/bin/bash

echo "=== NGROK SERVICE STARTEN ==="
echo ""

# Prüfen ob Token gesetzt ist
if [ -f ~/.config/ngrok/ngrok.yml ]; then
    echo "✅ Ngrok Token ist konfiguriert"
    echo "Config Datei: ~/.config/ngrok/ngrok.yml"
else
    echo "❌ Ngrok Token nicht gefunden"
    exit 1
fi

echo ""
echo "Starte ngrok Service..."
sudo systemctl start ngrok

echo ""
echo "Service für automatischen Start aktivieren..."
sudo systemctl enable ngrok

echo ""
echo "Status prüfen..."
sudo systemctl status ngrok --no-pager

echo ""
echo "=== NGROK SERVICE LOGS (letzte 10 Zeilen) ==="
sudo journalctl -u ngrok -n 10 --no-pager

echo ""
echo "=== AKTIVE NGROK PROZESSE ==="
ps aux | grep ngrok | grep -v grep

echo ""
echo "Wenn der Service läuft, sollten Sie die öffentliche URL in den Logs sehen."
echo "Zum Live-Verfolgen der Logs verwenden Sie:"
echo "  sudo journalctl -u ngrok -f"
