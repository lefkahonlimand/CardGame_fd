#!/bin/bash

echo "=== NGROK SERVICE DIAGNOSE ==="
echo "Datum: $(date)"
echo ""

echo "1. Ngrok Service Status:"
sudo systemctl status ngrok --no-pager
echo ""

echo "2. Ngrok Service Logs (letzte 20 Zeilen):"
sudo journalctl -u ngrok -n 20 --no-pager
echo ""

echo "3. Ngrok Service Datei:"
sudo cat /etc/systemd/system/ngrok.service
echo ""

echo "4. Ngrok Binary prüfen:"
ls -la /usr/local/bin/ngrok
echo ""

echo "5. Ngrok Version:"
/usr/local/bin/ngrok version
echo ""

echo "6. Umgebungsvariablen prüfen:"
echo "USER: $USER"
echo "HOME: $HOME"
echo "NGROK_AUTHTOKEN ist gesetzt: $(if [ -n "$NGROK_AUTHTOKEN" ]; then echo 'JA'; else echo 'NEIN'; fi)"
echo ""

echo "7. Ngrok config prüfen:"
if [ -f ~/.ngrok2/ngrok.yml ]; then
    echo "Ngrok config existiert:"
    cat ~/.ngrok2/ngrok.yml
else
    echo "Keine ngrok config gefunden in ~/.ngrok2/ngrok.yml"
fi
echo ""

echo "8. Aktive ngrok Prozesse:"
ps aux | grep ngrok
echo ""

echo "9. Port 3000 prüfen:"
sudo netstat -tlnp | grep :3000
echo ""

echo "10. Systemd Environment für ngrok service:"
sudo systemctl show ngrok -p Environment
echo ""

echo "=== DIAGNOSE ENDE ==="
