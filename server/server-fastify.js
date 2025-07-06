const fastify = require('fastify')({ logger: true });
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

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
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function dealInitialCards(playerId, count = 5) {
  const hand = [];
  for (let i = 0; i < count && gameState.deck.length > 0; i++) {
    hand.push(gameState.deck.pop());
  }
  gameState.playerHands[playerId] = hand;
}

function drawCard(playerId) {
  if (gameState.deck.length > 0) {
    gameState.playerHands[playerId].push(gameState.deck.pop());
  }
}

function validateMove(cardId, placeAt) {
  const card = cardsData.find(c => c.id === cardId);
  if (!card) return { valid: false, reason: 'Karte nicht gefunden' };

  const [x, y] = placeAt.split(',').map(Number);
  
  // Prüfe ob Position bereits belegt ist
  if (gameState.board[placeAt]) {
    return { valid: false, reason: 'Position bereits belegt' };
  }

  // Erste Karte - kann überall platziert werden (Origin)
  if (Object.keys(gameState.board).length === 0) {
    return { valid: true };
  }

  // Kreuz-Layout: Nur auf den beiden Hauptachsen
  // Vertikale Karten: nur auf der vertikalen Achse (x=0 oder mit anderen vertikalen verbunden)
  // Horizontale Karten: nur auf der horizontalen Achse (y=0 oder mit anderen horizontalen verbunden)
  
  if (card.orientation === 'hochformat') {
    // Vertikale Karten: Prüfe ob auf vertikaler Achse oder neben anderen vertikalen Karten
    let validVerticalPlacement = false;
    
    // Prüfe vertikal benachbarte Positionen
    const verticalNeighbors = [`${x},${y+1}`, `${x},${y-1}`];
    for (let pos of verticalNeighbors) {
      if (gameState.board[pos] && gameState.board[pos].orientation === 'hochformat') {
        validVerticalPlacement = true;
        break;
      }
    }
    
    if (!validVerticalPlacement) {
      return { valid: false, reason: 'Vertikale Karten müssen auf der vertikalen Achse platziert werden' };
    }
  } else if (card.orientation === 'querformat') {
    // Horizontale Karten: Prüfe ob auf horizontaler Achse oder neben anderen horizontalen Karten
    let validHorizontalPlacement = false;
    
    // Prüfe horizontal benachbarte Positionen
    const horizontalNeighbors = [`${x+1},${y}`, `${x-1},${y}`];
    for (let pos of horizontalNeighbors) {
      if (gameState.board[pos] && gameState.board[pos].orientation === 'querformat') {
        validHorizontalPlacement = true;
        break;
      }
    }
    
    if (!validHorizontalPlacement) {
      return { valid: false, reason: 'Horizontale Karten müssen auf der horizontalen Achse platziert werden' };
    }
  }

  // Prüfe Nachbarn für Wertvergleich
  let validNeighbor = null;
  
  if (card.orientation === 'hochformat') {
    // Vertikale Karten: Werte mit vertikalen Nachbarn vergleichen
    const above = gameState.board[`${x},${y+1}`];
    const below = gameState.board[`${x},${y-1}`];
    
    if (above && above.orientation === 'hochformat') {
      validNeighbor = { card: above, direction: 'above', shouldBeLess: true };
    } else if (below && below.orientation === 'hochformat') {
      validNeighbor = { card: below, direction: 'below', shouldBeLess: false };
    }
  } else if (card.orientation === 'querformat') {
    // Horizontale Karten: Werte mit horizontalen Nachbarn vergleichen
    const right = gameState.board[`${x+1},${y}`];
    const left = gameState.board[`${x-1},${y}`];
    
    if (right && right.orientation === 'querformat') {
      validNeighbor = { card: right, direction: 'right', shouldBeLess: true };
    } else if (left && left.orientation === 'querformat') {
      validNeighbor = { card: left, direction: 'left', shouldBeLess: false };
    }
  }

  // Wenn kein gültiger Nachbar gefunden wurde, aber Platzierung erlaubt ist
  if (!validNeighbor) {
    // Prüfe ob es überhaupt eine benachbarte Karte gibt
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
    
    // Wenn Nachbar vorhanden ist, aber keine Wertvergleich nötig (z.B. erste Karte in einer Reihe)
    return { valid: true };
  }

  // Prüfe Wertvergleich
  const cardValue = card.metric_value;
  const neighborValue = validNeighbor.card.metric_value;
  
  if (validNeighbor.shouldBeLess) {
    if (cardValue >= neighborValue) {
      return { valid: false, reason: `${card.name} (${cardValue}) sollte kleiner sein als ${validNeighbor.card.name} (${neighborValue})` };
    }
  } else {
    if (cardValue <= neighborValue) {
      return { valid: false, reason: `${card.name} (${cardValue}) sollte größer sein als ${validNeighbor.card.name} (${neighborValue})` };
    }
  }

  return { valid: true };
}

function initializeGame() {
  gameState.deck = shuffleArray([...cardsData]);
  gameState.board = {};
  gameState.playerHands = {};
  gameState.currentPlayerIndex = 0;
  gameState.playersOrder = Object.keys(gameState.players);
  gameState.currentPlayer = gameState.playersOrder[0];
  gameState.gameStatus = 'running';

  // Karten austeilen
  for (const playerId of gameState.playersOrder) {
    dealInitialCards(playerId);
  }
}

function nextPlayer() {
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.playersOrder.length;
  gameState.currentPlayer = gameState.playersOrder[gameState.currentPlayerIndex];
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

// Statische Dateien registrieren
fastify.register(require('fastify-static'), {
  root: path.join(__dirname, '../client'),
  prefix: '/'
});

// Server starten
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server läuft auf http://0.0.0.0:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Socket.IO Server
const io = new Server(fastify.server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Global error handler for Socket.IO
io.engine.on('connection_error', (err) => {
  console.log('Socket.IO connection error:', err.req, err.code, err.message, err.context);
});

// Socket.IO Event Handling
io.on('connection', (socket) => {
  console.log('Neuer Spieler verbunden:', socket.id);
  
  // Socket error handler
  socket.on('error', (error) => {
    console.error('Socket error for', socket.id, ':', error);
  });
  console.log('DEBUG: Current gameState before player join:', {
    gameStatus: gameState.gameStatus,
    playerCount: Object.keys(gameState.players).length,
    currentPlayer: gameState.currentPlayer
  });

  // Spieler zur Spielerliste hinzufügen
  gameState.players[socket.id] = {
    id: socket.id,
    name: `Spieler ${Object.keys(gameState.players).length + 1}`
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
  socket.on('playerMove', (data) => {
    const { cardId, placeAt } = data;
    
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
    if (!playerHand || !playerHand.find(card => card.id === cardId)) {
      socket.emit('error', { message: 'Karte nicht in der Hand' });
      return;
    }

    // Zug validieren
    const validation = validateMove(cardId, placeAt);
    if (!validation.valid) {
      // Falscher Zug - Spiel beenden
      console.log('DEBUG: Invalid move detected, ending game:', validation.reason);
      gameState.gameStatus = 'ended';
      const card = cardsData.find(c => c.id === cardId);
      
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

    // Gültiger Zug
    const card = cardsData.find(c => c.id === cardId);
    gameState.board[placeAt] = card;
    
    // Karte aus der Hand entfernen
    gameState.playerHands[socket.id] = playerHand.filter(c => c.id !== cardId);
    
    // Neue Karte ziehen
    drawCard(socket.id);
    
    // Nächster Spieler
    nextPlayer();
    
    // Spielzustand an alle Spieler senden
    Object.keys(gameState.players).forEach(playerId => {
      io.to(playerId).emit('gameState', getGameStateForClient(playerId));
    });
  });

  // Spieler verlässt
  socket.on('disconnect', () => {
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

start();
