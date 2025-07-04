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

  // Erste Karte - muss bei 0,0 sein
  if (Object.keys(gameState.board).length === 0) {
    if (placeAt !== '0,0') {
      return { valid: false, reason: 'Erste Karte muss bei 0,0 platziert werden' };
    }
    return { valid: true };
  }

  // Prüfe Orientierung und Nachbarschaftsregeln
  let validNeighbor = null;
  
  if (card.orientation === 'hochformat') {
    // Hochformat: vertikal (y-Achse)
    const above = gameState.board[`${x},${y + 1}`];
    const below = gameState.board[`${x},${y - 1}`];
    
    if (above) {
      const aboveCard = cardsData.find(c => c.id === above.id);
      if (aboveCard.orientation !== 'hochformat') {
        return { valid: false, reason: 'Hochformat-Karten müssen vertikal zu anderen Hochformat-Karten platziert werden' };
      }
      validNeighbor = { card: aboveCard, direction: 'above', shouldBeLess: true };
    } else if (below) {
      const belowCard = cardsData.find(c => c.id === below.id);
      if (belowCard.orientation !== 'hochformat') {
        return { valid: false, reason: 'Hochformat-Karten müssen vertikal zu anderen Hochformat-Karten platziert werden' };
      }
      validNeighbor = { card: belowCard, direction: 'below', shouldBeLess: false };
    } else {
      return { valid: false, reason: 'Hochformat-Karte muss neben einer anderen Hochformat-Karte platziert werden' };
    }
  } else if (card.orientation === 'querformat') {
    // Querformat: horizontal (x-Achse)
    const left = gameState.board[`${x - 1},${y}`];
    const right = gameState.board[`${x + 1},${y}`];
    
    if (left) {
      const leftCard = cardsData.find(c => c.id === left.id);
      if (leftCard.orientation !== 'querformat') {
        return { valid: false, reason: 'Querformat-Karten müssen horizontal zu anderen Querformat-Karten platziert werden' };
      }
      validNeighbor = { card: leftCard, direction: 'left', shouldBeLess: false };
    } else if (right) {
      const rightCard = cardsData.find(c => c.id === right.id);
      if (rightCard.orientation !== 'querformat') {
        return { valid: false, reason: 'Querformat-Karten müssen horizontal zu anderen Querformat-Karten platziert werden' };
      }
      validNeighbor = { card: rightCard, direction: 'right', shouldBeLess: true };
    } else {
      return { valid: false, reason: 'Querformat-Karte muss neben einer anderen Querformat-Karte platziert werden' };
    }
  }

  // Prüfe Wertvergleich
  if (validNeighbor) {
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
fastify.register(require('@fastify/static'), {
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

// Socket.IO Event Handling
io.on('connection', (socket) => {
  console.log('Neuer Spieler verbunden:', socket.id);

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
    if (gameState.gameStatus === 'waiting' && Object.keys(gameState.players).length >= 2) {
      console.log('Spiel wird gestartet...');
      initializeGame();
      
      // Spielzustand an alle Spieler senden
      Object.keys(gameState.players).forEach(playerId => {
        io.to(playerId).emit('gameState', getGameStateForClient(playerId));
      });
    }
  });

  // Spielerzug
  socket.on('playerMove', (data) => {
    const { cardId, placeAt } = data;
    
    // Validierung
    if (gameState.gameStatus !== 'running') {
      socket.emit('error', { message: 'Spiel läuft nicht' });
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
      gameState.gameStatus = 'ended';
      const card = cardsData.find(c => c.id === cardId);
      
      io.emit('roundEnd', {
        winner: null,
        loser: socket.id,
        loserName: gameState.players[socket.id].name,
        reason: validation.reason,
        cardPlayed: card,
        boardState: gameState.board
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
