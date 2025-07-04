# Jetson Nano Setup Guide

## Systemanforderungen

- **Hardware**: NVIDIA Jetson Nano
- **OS**: Ubuntu 18.04+ (ARM64)
- **RAM**: Mindestens 2GB verfügbar
- **Storage**: ~500MB für die Anwendung

## Voraussetzungen installieren

### 1. System aktualisieren
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Node.js installieren (Version 18+)
```bash
# NodeSource Repository hinzufügen
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Node.js installieren
sudo apt-get install -y nodejs

# Version prüfen
node --version
npm --version
```

### 3. Build Tools installieren
```bash
sudo apt-get install -y build-essential python3
```

## Anwendung deployen

### 1. Projekt übertragen
```bash
# Via SCP (von Windows PC)
scp -r card-estimation-game/ username@jetson-ip:~/

# Oder via Git
git clone <your-repo-url>
cd card-estimation-game
```

### 2. Automatisches Deployment
```bash
chmod +x deploy-jetson.sh
./deploy-jetson.sh
```

### 3. Manuelles Deployment
```bash
# Dependencies installieren
npm install --production

# PM2 global installieren
sudo npm install -g pm2

# Anwendung starten
pm2 start ecosystem.config.js

# PM2 Autostart einrichten
pm2 startup
pm2 save
```

## Firewall konfigurieren

```bash
# Port 3000 öffnen
sudo ufw allow 3000

# Firewall Status prüfen
sudo ufw status
```

## Performance Optimierung

### 1. Swap erhöhen (falls nötig)
```bash
# Aktuellen Swap prüfen
free -h

# 2GB Swap-Datei erstellen
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Permanent machen
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. PM2 Limits setzen
```bash
# Memory Limit auf 200MB setzen
pm2 restart card-estimation-game --max-memory-restart 200M
```

## Netzwerk-Zugriff

### Lokales Netzwerk
- **Jetson IP finden**: `hostname -I`
- **Zugriff**: `http://JETSON-IP:3000`

### Externe Zugriffe (optional)
```bash
# Router Port-Forwarding: 3000 -> Jetson-IP:3000
# Oder ngrok für temporären Zugang
npm install -g ngrok
ngrok http 3000
```

## Monitoring & Wartung

### PM2 Befehle
```bash
pm2 status                    # Status aller Apps
pm2 logs card-estimation-game # Live-Logs anzeigen
pm2 restart card-estimation-game # App neustarten
pm2 stop card-estimation-game    # App stoppen
pm2 delete card-estimation-game  # App entfernen
```

### System-Monitoring
```bash
# CPU/RAM Verwendung
htop

# Disk Space
df -h

# Netzwerk Aktivität
sudo netstat -tulpn | grep :3000
```

## Troubleshooting

### Port bereits belegt
```bash
# Prozess finden und beenden
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Node.js Memory Issues
```bash
# Node.js mit mehr Memory starten
node --max-old-space-size=512 server/server.js
```

### NPM Permissions
```bash
# NPM Ordner Berechtigung reparieren
sudo chown -R $(whoami) ~/.npm
```

## Performance Erwartungen

- **Startup Zeit**: ~5-10 Sekunden
- **Memory Verwendung**: ~50-100MB
- **Concurrent Users**: 10-20 Spieler
- **Response Time**: <100ms (lokales Netzwerk)

## Auto-Start beim Boot

```bash
# PM2 Startup konfigurieren
pm2 startup
# Den angezeigten Befehl ausführen

# Aktuelle Apps speichern
pm2 save

# Test: Neustart
sudo reboot
# Nach Neustart prüfen: pm2 status
```

✅ **Jetson Nano ist perfekt geeignet für diese Anwendung!**
