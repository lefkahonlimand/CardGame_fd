# 🎮 Card Estimation Game

Ein Multiplayer-Browser-basiertes Kartenspiel für Agile Planning Sessions und Gaming Sessions mit Echtzeit-Kommunikation.

## 🚀 Features

- **Real-time Multiplayer**: Socket.io powered real-time communication
- **Cross-Platform**: Läuft auf jedem Gerät mit Webbrowser
- **Jetson Nano optimiert**: Ideal für Raspberry Pi / Jetson Nano Deployment
- **Internet-Tunneling**: Ngrok-Integration für externe Erreichbarkeit
- **Management-Tools**: Umfassende Scripts für Wartung und Monitoring

## 🛠️ Technology Stack

- **Backend**: Node.js mit Express
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Real-time**: Socket.io
- **Deployment**: Jetson Nano, Ngrok tunneling

## 📦 Installation

### Voraussetzungen
- Node.js (v12+)
- npm
- Git

### Quick Start

```bash
git clone https://github.com/lefkahonlimand/CardGame_fd.git
cd CardGame_fd
npm install
npm start
```

### 🔒 Sichere Konfiguration

1. **Lokale Konfiguration erstellen:**
   ```bash
   cp .env.local.template .env.local.secure
   ```

2. **Werte in .env.local.secure anpassen:**
   - SSH-Zugangsdaten für Ihren Jetson/Server
   - Sudo-Passwort
   - Ngrok-Token (optional)

3. **Die .env.local.secure wird NICHT in Git gespeichert!**

## 🖥️ Jetson Nano Deployment

### Management-Tools

Das Projekt enthält umfassende Management-Scripts:

- **jetson-control.sh** - Hauptsteuerung für Services
- **monitor-jetson.sh** - Live-Monitoring  
- **deploy-to-jetson.sh** - Automatisches Deployment
- **jetson-diagnose.sh** - Problemdiagnose

### Sichere Wartung

```bash
# Status prüfen
./jetson-control.sh status

# Services starten
./jetson-control.sh start

# Live-Monitoring
./monitor-jetson.sh

# Automatisches Deployment
./deploy-to-jetson.sh
```

**Wichtig:** Verwenden Sie die WARTUNGSANLEITUNG_SECURE.md für sichere Befehle mit Platzhaltern.

## 🌐 Internet-Zugang

Das Spiel unterstützt Ngrok für sicheren Internet-Zugang:

1. **Ngrok-Account** bei [ngrok.com](https://ngrok.com) erstellen
2. **Authtoken** in Ihrer lokalen Konfiguration setzen
3. **Services starten** - URL wird automatisch generiert

## 📁 Projekt-Struktur

```
card-estimation-game/
├── client/                 # Frontend-Dateien
├── server/                 # Backend-Dateien  
├── docs/                   # Dokumentation
├── jetson-control.sh       # Service-Management
├── monitor-jetson.sh       # Monitoring
├── deploy-to-jetson.sh     # Deployment
└── .env.local.template     # Konfigurations-Template
```

## 🛡️ Sicherheit

- **Keine sensiblen Daten in Git**: Verwenden Sie .env.local.secure
- **Sichere Platzhalter**: Dokumentation mit {{PLACEHOLDER}} Syntax
- **Umfassende .gitignore**: Schutz vor versehentlichen Uploads
- **Templates**: Sichere Vorlagen für lokale Konfiguration

## 🎯 Game Features

- **Multiplayer Card Estimation**: Perfekt für Agile Planning
- **Real-time Updates**: Sofortige Synchronisation aller Spieler
- **Floating UI**: Intuitive Benutzeroberfläche
- **Cross-Browser**: Funktioniert auf allen modernen Browsern

## 📖 Dokumentation

- **WARTUNGSANLEITUNG_SECURE.md** - Sichere Wartungsanleitung (lokal)
- **JETSON_SETUP.md** - Jetson Nano Setup-Guide
- **DEBUG_GUIDE.md** - Debugging und Troubleshooting

## 🤝 Contributing

1. Fork des Repositories
2. Feature-Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Änderungen committen (`git commit -m 'Add amazing feature'`)
4. Branch pushen (`git push origin feature/amazing-feature`)
5. Pull Request öffnen

## 📝 License

Dieses Projekt ist Open Source unter der MIT License.

## 🔗 Links

- **Repository**: https://github.com/lefkahonlimand/CardGame_fd
- **Issues**: https://github.com/lefkahonlimand/CardGame_fd/issues

## 🎮 How to Play

1. Spiel im Browser öffnen
2. Spielername eingeben  
3. Auf andere Spieler warten
4. Mit den Karten schätzen
5. Ergebnisse in Echtzeit sehen

---

**Entwickelt mit ❤️ für Agile Teams und Gaming-Enthusiasten**

## 🔒 Sicherheitshinweis

Dieses Repository enthält **KEINE** sensiblen Daten. Alle Passwörter, IP-Adressen und Tokens werden lokal in `.env.local.secure` gespeichert und sind nicht Teil des öffentlichen Repositories.
