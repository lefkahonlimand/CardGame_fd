# Card Estimation Game - Alpha Version

Ein Multiplayer-Schätz- und Wissensspiel, bei dem Spieler versuchen, Karten mit verschiedenen Objekten und deren Eigenschaften korrekt auf einem zweidimensionalen Spielfeld zu platzieren.

## Spielkonzept

- **Ziel**: So lange wie möglich keinen Fehler machen
- **Spielzeit**: 5-15 Minuten pro Runde
- **Spieler**: 2+ Spieler
- **Karten**: Zwei Orientierungen (Hochformat/Querformat) mit verschiedenen Objekten und Messwerten

## Spielregeln

1. Jeder Spieler hat eine konstante Anzahl Handkarten
2. Hochformat-Karten müssen vertikal (über/unter) platziert werden
3. Querformat-Karten müssen horizontal (links/rechts) platziert werden
4. Spieler müssen schätzen, ob ihre Karte größer oder kleiner als die Nachbarkarte ist
5. Bei einem falschen Zug endet die Runde sofort

## Tech Stack

- **Backend**: Node.js mit Fastify
- **WebSocket**: Socket.IO für Echtzeit-Kommunikation
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Prozess-Manager**: PM2

## Installation

### Voraussetzungen
- Node.js (Version 18+)
- npm

### Setup
```bash
# Repository klonen/navigieren
cd card-estimation-game

# Abhängigkeiten installieren
npm install

# Server starten (Development)
npm start

# Oder mit PM2 (Production)
npm run pm2:start
```

## Verwendung

1. Server starten
2. Browser öffnen und zu `http://localhost:3000` navigieren
3. Mindestens 2 Spieler verbinden
4. "Spiel starten" klicken
5. Karten aus der Hand auswählen und mit X,Y-Koordinaten platzieren

## Spielsteuerung

- **Karte auswählen**: Auf Handkarte klicken
- **Karte platzieren**: X/Y-Koordinaten eingeben und "Karte platzieren" drücken
- **Koordinatensystem**: (0,0) ist das Zentrum, positive Y geht nach oben

## Projektstruktur

```
card-estimation-game/
├── server/
│   ├── server.js          # Hauptserver mit Fastify + Socket.IO
│   └── cards.json         # Kartendatenbank
├── client/
│   ├── index.html         # Frontend
│   └── client.js          # Client-JavaScript
├── package.json
├── ecosystem.config.js    # PM2 Konfiguration
└── README.md
```

## Für Jetson Nano Deployment

Das Projekt ist für ARM64-Architektur optimiert und läuft auf Jetson Nano:

```bash
# PM2 global installieren (falls nicht vorhanden)
npm install -g pm2

# Projekt starten
pm2 start ecosystem.config.js

# Status prüfen
pm2 status

# Logs anzeigen
pm2 logs card-estimation-game
```

## Alpha Version Features

✅ Grundlegende Spiellogik  
✅ Multiplayer WebSocket-Verbindung  
✅ Kartenvalidierung nach Spielregeln  
✅ Einfaches Frontend für Tests  
✅ PM2 Konfiguration für Produktion  

## Bekannte Einschränkungen (Alpha)

- Minimales Design (funktional, nicht schön)
- Keine Persistierung von Spielständen
- Kein Replay-System
- Begrenzte Kartenmenge (10 Beispielkarten)
- Keine Benutzerregistrierung

## Nächste Schritte

- UI/UX Verbesserungen
- Mehr Karten hinzufügen
- Spielstatistiken
- Bessere Visualisierung des Spielbretts
- Mobile Optimierung
