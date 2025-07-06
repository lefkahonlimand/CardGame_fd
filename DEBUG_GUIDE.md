# 🐛 Debug Guide für Card Estimation Game

## Übersicht

Das Debugging-System wurde implementiert, um die genannten Probleme zu identifizieren und zu lösen:

1. **Neustart funktioniert nicht**
2. **Event-Popup nach Rundenende geht nicht weg**
3. **Button "Spiel neustarten" funktioniert nicht (Menü + Popup)**
4. **Button "Runde beenden" im Menü funktioniert nicht**

## 🔧 Debug-Tools aktivieren

### Automatische Aktivierung
Der Debug-Modus wird automatisch aktiviert wenn:
- `localhost` als Hostname verwendet wird
- URL-Parameter `?debug=true` gesetzt ist
- LocalStorage `cardGameDebug=true` gesetzt ist

### Manuelle Aktivierung
```javascript
// Im Browser Console
localStorage.setItem('cardGameDebug', 'true');
window.location.reload();
```

## 🎮 Debug-Panel verwenden

### Tastenkombinationen
- **Ctrl+Shift+D**: Debug-Panel öffnen/schließen
- **F5** oder **Ctrl+R**: Spiel-Menü öffnen (überschreibt Standard-Reload)
- **Escape**: Modals schließen

### Debug-Panel Features
- **Live Logs**: Alle Events in Echtzeit
- **Filter**: Nach Kategorien filtern (Game, Socket, UI, Validation, Error)
- **Export**: Logs als JSON-Datei herunterladen
- **Clear**: Alle Logs löschen

## 📊 Log-Kategorien

### Game Events
```javascript
gameDebug.logGameEvent('Game started', { players: 2 });
```
- Spielstart/-ende
- Rundenwechsel
- Zustandsänderungen

### Socket Events  
```javascript
gameDebug.logSocketEvent('playerMove', { cardId: '123' });
```
- Alle Socket.IO Nachrichten
- Verbindungsstatus
- Server-Antworten

### UI Events
```javascript
gameDebug.logUIEvent('Button clicked', { buttonId: 'start-game' });
```
- Button-Klicks
- Modal-Öffnungen/-Schließungen
- Benutzerinteraktionen

### Validation
```javascript
gameDebug.logValidation(false, 'Invalid move', { reason: 'Card not adjacent' });
```
- Zug-Validierungen
- Eingabe-Prüfungen
- Regel-Überprüfungen

### Errors
```javascript
gameDebug.logError(error, { context: 'button-click' });
```
- JavaScript-Fehler
- Unbehandelte Promise-Rejections
- Socket-Fehler

## 🔍 Spezifische Problem-Diagnose

### Problem 1: Neustart funktioniert nicht

**Zu prüfen:**
1. Wird `startGame` Socket-Event gesendet?
2. Antwortet der Server?
3. Wird der neue Spielzustand empfangen?

**Debug-Befehle:**
```javascript
// Im Browser Console nach Button-Klick
gameDebug.logs.filter(log => log.category === 'socket' && log.message.includes('startGame'))
```

### Problem 2: Event-Popup geht nicht weg

**Zu prüfen:**
1. Werden Modal-Hide Events ausgelöst?
2. CSS Display-Eigenschaft korrekt gesetzt?
3. Event-Listener korrekt gebunden?

**Debug-Befehle:**
```javascript
// Modal Status prüfen
document.getElementById('game-end-modal').style.display;

// Event-Listener prüfen
gameDebug.logs.filter(log => log.message.includes('modal'))
```

### Problem 3: Button "Spiel neustarten" funktioniert nicht

**Zu prüfen:**
1. Event-Listener korrekt gebunden?
2. Socket-Verbindung aktiv?
3. Button-State (disabled/enabled)?

**Debug-Befehle:**
```javascript
// Button-Events anzeigen
gameDebug.logs.filter(log => log.message.includes('Restart Game Button'))

// Socket-Status prüfen
gameManager.socket?.connected
```

### Problem 4: Button "Runde beenden" funktioniert nicht

**Zu prüfen:**
1. Button sichtbar/aktiviert?
2. Event-Listener vorhanden?
3. Server-Event implementiert?

**Debug-Befehle:**
```javascript
// End Game Button Events
gameDebug.logs.filter(log => log.message.includes('End Game'))
```

## 🛠️ Erweiterte Debug-Methoden

### Performance Monitoring
```javascript
gameDebug.startPerformanceTimer('cardPlacement');
// ... Code ausführen ...
gameDebug.endPerformanceTimer('cardPlacement');
```

### Game State Tracking
```javascript
gameDebug.logGameState(currentGameState, 'after button click');
```

### Network Monitoring
Alle Socket-Events werden automatisch geloggt:
```javascript
// Ausgehend
gameDebug.logSocketEmit('playerMove', data);

// Eingehend  
gameDebug.logSocketReceive('gameState', gameState);
```

## 📋 Debug-Checkliste

### Bei Button-Problemen:
- [ ] Event-Listener registriert?
- [ ] Button nicht disabled?
- [ ] Korrekte Element-ID?
- [ ] JavaScript-Fehler in Console?
- [ ] Socket-Verbindung aktiv?

### Bei Modal-Problemen:
- [ ] Modal-Element vorhanden?
- [ ] CSS Display-Eigenschaft?
- [ ] Event-Propagation gestoppt?
- [ ] Z-Index Konflikte?

### Bei Socket-Problemen:
- [ ] Verbindung aktiv?
- [ ] Event korrekt gesendet?
- [ ] Server-Antwort erhalten?
- [ ] Event-Handler registriert?

## 🧪 Test-Funktionen

```javascript
// Alle Debug-Funktionen testen
testDebugFunctions();

// Spezielle Tests
gameDebug.logGameEvent('Manual test', { testId: Date.now() });
gameDebug.exportLogs(); // Download für Analyse
```

## 📁 Log-Export und -Analyse

### Logs exportieren
1. Debug-Panel öffnen (Ctrl+Shift+D)
2. "Export" Button klicken
3. JSON-Datei wird heruntergeladen

### Log-Struktur
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "message": "Button clicked",
  "data": { "buttonId": "start-game" },
  "category": "ui",
  "sessionTime": 5000
}
```

## 🚨 Häufige Probleme und Lösungen

### "gameDebug is not defined"
```javascript
// Prüfen ob Debug-Utils geladen
if (typeof window.gameDebug === 'undefined') {
    console.error('Debug utilities not loaded! Check script inclusion.');
}
```

### Logs werden nicht angezeigt
```javascript
// Log-Level prüfen
gameDebug.logLevel; // sollte 'debug' oder 'info' sein

// Debug-Modus prüfen
gameDebug.isDebugMode; // sollte true sein
```

### Socket-Events fehlen
```javascript
// Manuelle Socket-Logs
socket.onAny((event, data) => {
    gameDebug.logSocketReceive(event, data);
});
```

## 🔧 Erweiterte Konfiguration

### Log-Level ändern
```javascript
localStorage.setItem('cardGameLogLevel', 'debug'); // debug, info, warn, error
```

### Debug-UI deaktivieren
```javascript
localStorage.setItem('cardGameDebug', 'false');
```

### Persistent Error Logs
Fehler werden automatisch im LocalStorage gespeichert:
```javascript
// Gespeicherte Fehler anzeigen
JSON.parse(localStorage.getItem('cardGameErrorLogs') || '[]');
```

## 📞 Support

Bei weiteren Problemen:
1. Logs exportieren
2. Browser Console Screenshots
3. Reproduktionsschritte dokumentieren
4. Debug-Logs als JSON-Datei bereitstellen
