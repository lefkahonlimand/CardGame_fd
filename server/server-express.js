const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Karten laden
const cardsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'cards.json'), 'utf8'));

// Globaler Spielzustand
let gameState = {
  players: {},
  deck: [],
  playerHands: {},
  board: {},
  currentPlayer: null,
  gameStatus: 'waiting', // 'waiting', 'running', 'ended'
  playersOrder: [],
  currentPlayerIndex: 0
};

// Hilfsfunktionen
function shuffleArray(array) {
  const shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
}

function dealInitialCards(playerId, count) {
  if (!count) count = 5;
  const hand = [];
  for (let i = 0; i < count && gameState.deck.length > 0; i++) {
    hand.push(gameState.deck.pop());
  }
  gameState.playerHands[playerId] = hand;
}

function createCardForBoard(card, x, y) {
  // Bestimme Orientierung basierend auf Position
  let orientation;
  let metric_value;
  let metric_name;
  
  if (x === 0 && y === 0) {
    // Ursprungskarte - zeige verfügbare Werte an
    orientation = 'origin';
    if (card.height !== null && card.width !== null) {
      metric_value = `H:${card.height} / B:${card.width}`;
    } else if (card.height !== null) {
      metric_value = `H:${card.height}`;
    } else if (card.width !== null) {
      metric_value = `B:${card.width}`;
    } else {
      metric_value = 'N/A';
    }
    metric_name = 'Größe';
  } else if (y === 0) {
    // Horizontale Achse - verwende Breite
    orientation = 'querformat';
    metric_value = card.width;
    metric_name = 'Breite';
  } else if (x === 0) {
    // Vertikale Achse - verwende Höhe
    orientation = 'hochformat';
    metric_value = card.height;
    metric_name = 'Höhe';
  } else {
    // Sollte nicht vorkommen im Kreuz-Layout
    throw new Error('Ungültige Position im Kreuz-Layout');
  }
  
  return {
    ...card,
    orientation,
    metric_value,
    metric_name
  };
}

function drawCard(playerId) {
  if (gameState.deck.length > 0) {
    gameState.playerHands[playerId].push(gameState.deck.pop());
  }
}

function validateMove(cardId, placeAt) {
  const card = cardsData.find(function(c) { return c.id === cardId; });
  if (!card) return { valid: false, reason: 'Karte nicht gefunden' };

  const coords = placeAt.split(',').map(Number);
  const x = coords[0];
  const y = coords[1];
  
  // Prüfe ob Position bereits belegt ist
  if (gameState.board[placeAt]) {
    return { valid: false, reason: 'Position bereits belegt' };
  }

  // Erste Karte - kann überall platziert werden (Origin)
  if (Object.keys(gameState.board).length === 0) {
    return { valid: true };
  }

  // Bestimme Orientierung und Metrik basierend auf Position
  let cardOrientation;
  let cardValue;
  
  if (x === 0 && y === 0) {
    // Ursprungskarte - das sollte nicht passieren wenn bereits Karten vorhanden sind
    return { valid: false, reason: 'Ursprungsposition bereits belegt' };
  } else if (y === 0) {
    // Horizontale Achse - prüfe ob Karte horizontal erlaubt ist
    if (card.allowed_axes && !card.allowed_axes.includes('horizontal')) {
      return { valid: false, reason: `${card.name} kann nicht auf der horizontalen Achse platziert werden` };
    }
    if (card.width === null || card.width === undefined) {
      return { valid: false, reason: `${card.name} hat keinen gültigen Breitenwert für die horizontale Achse` };
    }
    cardOrientation = 'querformat';
    cardValue = card.width;
  } else if (x === 0) {
    // Vertikale Achse - prüfe ob Karte vertikal erlaubt ist
    if (card.allowed_axes && !card.allowed_axes.includes('vertical')) {
      return { valid: false, reason: `${card.name} kann nicht auf der vertikalen Achse platziert werden` };
    }
    if (card.height === null || card.height === undefined) {
      return { valid: false, reason: `${card.name} hat keinen gültigen Höhenwert für die vertikale Achse` };
    }
    cardOrientation = 'hochformat';
    cardValue = card.height;
  } else {
    // Außerhalb der Kreuz-Achsen
    return { valid: false, reason: 'Karte kann nur auf den Hauptachsen (horizontal oder vertikal) platziert werden' };
  }
  
  // Prüfe ob mindestens eine benachbarte Karte existiert
  const allNeighbors = [`${x+1},${y}`, `${x-1},${y}`, `${x},${y+1}`, `${x},${y-1}`];
  let hasAnyNeighbor = false;
  for (let pos of allNeighbors) {
    if (gameState.board[pos]) {
      hasAnyNeighbor = true;
      break;
    }
  }
  
  if (!hasAnyNeighbor) {
    return { valid: false, reason: 'Karte muss neben einer existierenden Karte platziert werden' };
  }
  
  // Prüfe Wertvergleich mit relevanten Nachbarn
  let validNeighbor = null;
  
  if (cardOrientation === 'hochformat') {
    // Vertikale Karten: Werte mit vertikalen Nachbarn vergleichen
    const above = gameState.board[`${x},${y+1}`];
    const below = gameState.board[`${x},${y-1}`];
    
    if (above && (above.orientation === 'hochformat' || above.orientation === 'origin')) {
      // Bei Ursprungskarte verwende Höhenwert
      const compareValue = above.orientation === 'origin' ? above.height : above.metric_value;
      validNeighbor = { card: above, direction: 'above', shouldBeLess: true, compareValue };
    } else if (below && (below.orientation === 'hochformat' || below.orientation === 'origin')) {
      // Bei Ursprungskarte verwende Höhenwert
      const compareValue = below.orientation === 'origin' ? below.height : below.metric_value;
      validNeighbor = { card: below, direction: 'below', shouldBeLess: false, compareValue };
    }
    
    // Prüfe ob horizontale Nachbarn vorhanden sind - das ist verboten (außer Ursprungskarte)
    const horizontalNeighbors = [`${x+1},${y}`, `${x-1},${y}`];
    for (let pos of horizontalNeighbors) {
      const neighbor = gameState.board[pos];
      if (neighbor && neighbor.orientation !== 'origin') {
        return { valid: false, reason: 'Vertikale Karten können nicht horizontal neben andere Karten platziert werden' };
      }
    }
  } else if (cardOrientation === 'querformat') {
    // Horizontale Karten: Werte mit horizontalen Nachbarn vergleichen
    const right = gameState.board[`${x+1},${y}`];
    const left = gameState.board[`${x-1},${y}`];
    
    if (right && (right.orientation === 'querformat' || right.orientation === 'origin')) {
      // Bei Ursprungskarte verwende Breitenwert
      const compareValue = right.orientation === 'origin' ? right.width : right.metric_value;
      validNeighbor = { card: right, direction: 'right', shouldBeLess: true, compareValue };
    } else if (left && (left.orientation === 'querformat' || left.orientation === 'origin')) {
      // Bei Ursprungskarte verwende Breitenwert
      const compareValue = left.orientation === 'origin' ? left.width : left.metric_value;
      validNeighbor = { card: left, direction: 'left', shouldBeLess: false, compareValue };
    }
    
    // Prüfe ob vertikale Nachbarn vorhanden sind - das ist verboten (außer Ursprungskarte)
    const verticalNeighbors = [`${x},${y+1}`, `${x},${y-1}`];
    for (let pos of verticalNeighbors) {
      const neighbor = gameState.board[pos];
      if (neighbor && neighbor.orientation !== 'origin') {
        return { valid: false, reason: 'Horizontale Karten können nicht vertikal neben andere Karten platziert werden' };
      }
    }
  }

  // Wenn kein Nachbar für Wertvergleich gefunden wurde, ist das OK (erste Karte einer Orientierung)
  if (!validNeighbor) {
    return { valid: true };
  }

  // Prüfe Wertvergleich
  const neighborValue = validNeighbor.compareValue || validNeighbor.card.metric_value;
  
  if (validNeighbor.shouldBeLess) {
    if (cardValue >= neighborValue) {
      return { valid: false, reason: card.name + ' (' + cardValue + ') sollte kleiner sein als ' + validNeighbor.card.name + ' (' + neighborValue + ')' };
    }
  } else {
    if (cardValue <= neighborValue) {
      return { valid: false, reason: card.name + ' (' + cardValue + ') sollte größer sein als ' + validNeighbor.card.name + ' (' + neighborValue + ')' };
    }
  }

  return { valid: true };
}

function initializeGame() {
  gameState.deck = shuffleArray(cardsData.slice());
  gameState.board = {};
  gameState.playerHands = {};
  gameState.currentPlayerIndex = 0;
  gameState.playersOrder = Object.keys(gameState.players);
  gameState.currentPlayer = gameState.playersOrder[0];
  gameState.gameStatus = 'running';

  // Karten austeilen
  for (let i = 0; i < gameState.playersOrder.length; i++) {
    dealInitialCards(gameState.playersOrder[i]);
  }
}

function nextPlayer() {
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.playersOrder.length;
  gameState.currentPlayer = gameState.playersOrder[gameState.currentPlayerIndex];
}

function shiftCardsIfNeeded(insertX, insertY, insertOrientation) {
  // Check if we're inserting between existing cards and need to shift
  if (insertOrientation === 'querformat') {
    // Horizontal card insertion - check if we need to shift cards to the right
    const cardsToShift = [];
    
    // Find all horizontal cards to the right that need shifting
    for (let checkX = insertX; checkX <= 10; checkX++) {
      const pos = `${checkX},${insertY}`;
      const card = gameState.board[pos];
      if (card && card.orientation === 'querformat') {
        cardsToShift.push({ pos, card, newX: checkX + 1 });
      } else if (!card) {
        break; // Empty space, no more shifting needed
      }
    }
    
    // Shift cards from right to left to avoid overwriting
    for (let i = cardsToShift.length - 1; i >= 0; i--) {
      const item = cardsToShift[i];
      delete gameState.board[item.pos];
      gameState.board[`${item.newX},${insertY}`] = item.card;
    }
  } else if (insertOrientation === 'hochformat') {
    // Vertical card insertion - check if we need to shift cards upward
    const cardsToShift = [];
    
    // Find all vertical cards above that need shifting
    for (let checkY = insertY; checkY <= 10; checkY++) {
      const pos = `${insertX},${checkY}`;
      const card = gameState.board[pos];
      if (card && card.orientation === 'hochformat') {
        cardsToShift.push({ pos, card, newY: checkY + 1 });
      } else if (!card) {
        break; // Empty space, no more shifting needed
      }
    }
    
    // Shift cards from top to bottom to avoid overwriting
    for (let i = cardsToShift.length - 1; i >= 0; i--) {
      const item = cardsToShift[i];
      delete gameState.board[item.pos];
      gameState.board[`${insertX},${item.newY}`] = item.card;
    }
  }
}

function getGameStateForClient(playerId) {
  return {
    players: gameState.players,
    board: gameState.board,
    currentPlayer: gameState.currentPlayer,
    gameStatus: gameState.gameStatus,
    playerHand: gameState.playerHands[playerId] || [],
    deckCount: gameState.deck.length
  };
}

// Statische Dateien bereitstellen
app.use(express.static(path.join(__dirname, '../client')));

// Global error handler for Socket.IO (Jetson Nano kompatibel)
io.engine.on('connection_error', function(err) {
  console.log('Socket.IO connection error:', err.req, err.code, err.message, err.context);
});

// Socket.IO Event Handling
io.on('connection', function(socket) {
  console.log('Neuer Spieler verbunden:', socket.id);
  console.log('DEBUG: Current gameState before player join:', {
    gameStatus: gameState.gameStatus,
    playerCount: Object.keys(gameState.players).length,
    currentPlayer: gameState.currentPlayer
  });
  
  // Socket error handler (ES5 kompatibel)
  socket.on('error', function(error) {
    console.error('Socket error for', socket.id, ':', error);
  });

  // Spieler zur Spielerliste hinzufügen
  gameState.players[socket.id] = {
    id: socket.id,
    name: 'Spieler ' + (Object.keys(gameState.players).length + 1)
  };

  // Aktuellen Spielzustand an den neuen Spieler senden
  socket.emit('gameState', getGameStateForClient(socket.id));

  // Alle Spieler über neuen Spieler informieren
  socket.broadcast.emit('playerJoined', {
    playerId: socket.id,
    playerName: gameState.players[socket.id].name,
    playerCount: Object.keys(gameState.players).length
  });

  // Spiel starten
  socket.on('startGame', () => {
    console.log('DEBUG: Start game event triggered by player:', socket.id);
    console.log('DEBUG: Current gameState:', {
      status: gameState.gameStatus,
      players: Object.keys(gameState.players),
      playerCount: Object.keys(gameState.players).length,
      currentPlayer: gameState.currentPlayer,
      board: Object.keys(gameState.board).length + ' cards on board'
    });
    
    if ((gameState.gameStatus === 'waiting' || gameState.gameStatus === 'ended') && Object.keys(gameState.players).length >= 2) {
      console.log('DEBUG: Starting game...');
      initializeGame();
      
      console.log('DEBUG: Game initialized. New state:', {
        status: gameState.gameStatus,
        currentPlayer: gameState.currentPlayer,
        deckCount: gameState.deck.length,
        playersOrder: gameState.playersOrder
      });
      
      // Spielzustand an alle Spieler senden
      console.log('DEBUG: Broadcasting new gameState to all players...');
      
      Object.keys(gameState.players).forEach(playerId => {
        const clientState = getGameStateForClient(playerId);
        console.log(`DEBUG: Sending gameState to player ${playerId}:`, {
          gameStatus: clientState.gameStatus,
          currentPlayer: clientState.currentPlayer,
          handCount: clientState.playerHand.length
        });
        io.to(playerId).emit('gameState', clientState);
      });
      
      // Additional broadcast to ensure all connected clients receive the update
      io.emit('gameStateUpdate', {
        gameStatus: gameState.gameStatus,
        timestamp: new Date().toISOString()
      });
      
      console.log('DEBUG: New round started successfully. Status:', gameState.gameStatus);
    } else {
      console.log('DEBUG: Cannot start game - Status:', gameState.gameStatus, 'Player count:', Object.keys(gameState.players).length);
      socket.emit('error', { 
        message: gameState.gameStatus !== 'waiting' && gameState.gameStatus !== 'ended' 
          ? 'Spiel läuft bereits' 
          : 'Zu wenige Spieler'
      });
    }
  });

  // Spielerzug
  socket.on('playerMove', function(data) {
    const cardId = data.cardId;
    const placeAt = data.placeAt;
    const insertionMode = data.insertionMode; // Neuer Parameter für Floating Insertion
    
    console.log('DEBUG: Player move received:', {
      cardId: cardId,
      placeAt: placeAt,
      insertionMode: insertionMode,
      playerId: socket.id
    });
    
    // Validierung
    if (gameState.gameStatus !== 'running') {
      console.log('DEBUG: Player move rejected - game not running. Status:', gameState.gameStatus);
      try {
        socket.emit('error', { message: 'Spiel läuft nicht' });
      } catch (err) {
        console.error('Error sending error message to client:', err);
      }
      return;
    }

    if (socket.id !== gameState.currentPlayer) {
      socket.emit('error', { message: 'Du bist nicht an der Reihe' });
      return;
    }

    const playerHand = gameState.playerHands[socket.id];
    if (!playerHand || !playerHand.find(function(card) { return card.id === cardId; })) {
      socket.emit('error', { message: 'Karte nicht in der Hand' });
      return;
    }

    // NEUE LOGIK: Floating Insertion Position verarbeiten
    let actualX, actualY, needsInsertion = false;
    
    if (insertionMode && placeAt.includes('.')) {
      // Floating Position erkannt (z.B. "0.5,0" oder "0,0.5")
      console.log('DEBUG: Floating insertion detected:', placeAt);
      const [floatX, floatY] = placeAt.split(',').map(Number);
      
      // Konvertiere Floating Position zu ganzzahliger Insertion Position
      if (!Number.isInteger(floatX)) {
        // Horizontale Insertion zwischen Karten
        actualX = Math.ceil(floatX); // 0.5 -> 1, 1.5 -> 2, -0.5 -> 0
        actualY = floatY;
        needsInsertion = true;
        console.log(`DEBUG: Horizontal insertion - floatX: ${floatX} -> actualX: ${actualX}`);
      } else if (!Number.isInteger(floatY)) {
        // Vertikale Insertion zwischen Karten
        actualX = floatX;
        actualY = Math.ceil(floatY); // 0.5 -> 1, 1.5 -> 2, -0.5 -> 0
        needsInsertion = true;
        console.log(`DEBUG: Vertical insertion - floatY: ${floatY} -> actualY: ${actualY}`);
      }
    } else {
      // Normale Position
      const coords = placeAt.split(',').map(Number);
      actualX = coords[0];
      actualY = coords[1];
    }
    
    const actualPlaceAt = `${actualX},${actualY}`;
    console.log('DEBUG: Calculated actual position:', actualPlaceAt, 'needsInsertion:', needsInsertion);

    // Gültiger Zug
    const card = cardsData.find(function(c) { return c.id === cardId; });
    
    // Bestimme Orientierung für die neue Karte
    let cardOrientation;
    if (actualX === 0 && actualY === 0) {
      cardOrientation = 'origin';
    } else if (actualY === 0) {
      cardOrientation = 'querformat';
    } else if (actualX === 0) {
      cardOrientation = 'hochformat';
    }
    
    // WICHTIG: Karten verschieben VOR der Validierung (bei Insertion)
    if (needsInsertion) {
      console.log('DEBUG: Performing card insertion with shifting at:', actualPlaceAt);
      shiftCardsIfNeeded(actualX, actualY, cardOrientation);
    }
    
    // Zug validieren (NACH dem Verschieben bei Insertion)
    const validation = validateMove(cardId, actualPlaceAt);
    if (!validation.valid) {
      // Falscher Zug - Spiel beenden
      console.log('DEBUG: Invalid move detected, ending game:', validation.reason);
      gameState.gameStatus = 'ended';
      
      const roundEndData = {
        winner: null,
        loser: socket.id,
        loserName: gameState.players[socket.id].name,
        reason: validation.reason,
        cardPlayed: card,
        boardState: gameState.board
      };
      
      console.log('DEBUG: Sending roundEnd event to all players');
      io.emit('roundEnd', roundEndData);
      
      // WICHTIG: Auch gameState mit 'ended' an alle senden
      console.log('DEBUG: Sending updated gameState (ended) to all players');
      Object.keys(gameState.players).forEach(playerId => {
        io.to(playerId).emit('gameState', getGameStateForClient(playerId));
      });
      
      return;
    }
    
    // Erstelle Karte für das Board mit korrekten Eigenschaften
    const boardCard = createCardForBoard(card, actualX, actualY);
    gameState.board[actualPlaceAt] = boardCard;
    
    console.log('DEBUG: Card placed successfully at:', actualPlaceAt, 'Total board cards:', Object.keys(gameState.board).length);
    
    // Karte aus der Hand entfernen
    gameState.playerHands[socket.id] = playerHand.filter(function(c) { return c.id !== cardId; });
    
    // Neue Karte ziehen
    drawCard(socket.id);
    
    // Nächster Spieler
    nextPlayer();
    
    // Spielzustand an alle Spieler senden
    Object.keys(gameState.players).forEach(function(playerId) {
      io.to(playerId).emit('gameState', getGameStateForClient(playerId));
    });
  });

  // Spieler verlässt
  socket.on('disconnect', function() {
    console.log('Spieler verlassen:', socket.id);
    
    delete gameState.players[socket.id];
    delete gameState.playerHands[socket.id];
    
    // Spiel beenden wenn zu wenige Spieler
    if (Object.keys(gameState.players).length < 2 && gameState.gameStatus === 'running') {
      gameState.gameStatus = 'waiting';
      io.emit('gameState', { gameStatus: 'waiting', message: 'Spiel beendet - zu wenige Spieler' });
    }
    
    socket.broadcast.emit('playerLeft', {
      playerId: socket.id,
      playerCount: Object.keys(gameState.players).length
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', function() {
  console.log('Server läuft auf http://0.0.0.0:' + PORT);
});
