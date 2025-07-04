// Socket.IO Verbindung
const socket = io();

// DOM Elemente
const statusMessage = document.getElementById('status-message');
const playerCount = document.getElementById('player-count');
const currentPlayerSpan = document.getElementById('current-player');
const deckCount = document.getElementById('deck-count');
const playersContainer = document.getElementById('players-container');
const startGameBtn = document.getElementById('start-game');
const placeCardBtn = document.getElementById('place-card');
const placeXInput = document.getElementById('place-x');
const placeYInput = document.getElementById('place-y');
const gameBoard = document.getElementById('game-board');
const handCards = document.getElementById('hand-cards');

// Globale Variablen
let currentGameState = null;
let selectedCard = null;
let myPlayerId = null;

// Event Listeners
startGameBtn.addEventListener('click', () => {
    socket.emit('startGame');
});

placeCardBtn.addEventListener('click', () => {
    if (selectedCard && placeXInput.value !== '' && placeYInput.value !== '') {
        const placeAt = `${placeXInput.value},${placeYInput.value}`;
        socket.emit('playerMove', {
            cardId: selectedCard.id,
            placeAt: placeAt
        });
        
        // Eingabefelder zurücksetzen
        placeXInput.value = '';
        placeYInput.value = '';
        selectedCard = null;
        updateHandCards();
    }
});

// Socket Event Listeners
socket.on('connect', () => {
    myPlayerId = socket.id;
    updateStatus('Verbunden! Warte auf andere Spieler...', 'success');
});

socket.on('disconnect', () => {
    updateStatus('Verbindung getrennt!', 'error');
});

socket.on('gameState', (gameState) => {
    currentGameState = gameState;
    updateGameDisplay();
});

socket.on('playerJoined', (data) => {
    updateStatus(`${data.playerName} ist beigetreten. Spieler: ${data.playerCount}`, 'success');
    updatePlayerCount(data.playerCount);
});

socket.on('playerLeft', (data) => {
    updateStatus(`Ein Spieler hat das Spiel verlassen. Spieler: ${data.playerCount}`, 'warning');
    updatePlayerCount(data.playerCount);
});

socket.on('roundEnd', (result) => {
    let message = `Runde beendet! `;
    if (result.loser === myPlayerId) {
        message += `Du hast einen Fehler gemacht: ${result.reason}`;
        updateStatus(message, 'error');
    } else {
        message += `${result.loserName} hat einen Fehler gemacht: ${result.reason}`;
        updateStatus(message, 'warning');
    }
    
    // Zeige die richtige Antwort an
    setTimeout(() => {
        updateStatus(`Aufgelöst: ${result.cardPlayed.name} hat ${result.cardPlayed.metric_name}: ${result.cardPlayed.metric_value}`, 'info');
    }, 2000);
});

socket.on('error', (error) => {
    updateStatus(`Fehler: ${error.message}`, 'error');
});

// Hilfsfunktionen
function updateStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = '';
    statusMessage.classList.add(type);
}

function updatePlayerCount(count) {
    playerCount.textContent = count;
    startGameBtn.disabled = count < 2;
}

function updateGameDisplay() {
    if (!currentGameState) return;
    
    // Spieler-Info aktualisieren
    updatePlayerCount(Object.keys(currentGameState.players).length);
    
    // Aktueller Spieler
    if (currentGameState.currentPlayer) {
        const currentPlayerName = currentGameState.players[currentGameState.currentPlayer]?.name || 'Unbekannt';
        currentPlayerSpan.textContent = currentPlayerName;
        
        if (currentGameState.currentPlayer === myPlayerId) {
            updateStatus('Du bist an der Reihe!', 'warning');
            placeCardBtn.disabled = false;
        } else {
            updateStatus(`${currentPlayerName} ist an der Reihe...`, 'info');
            placeCardBtn.disabled = true;
        }
    }
    
    // Deck Count
    deckCount.textContent = currentGameState.deckCount || 0;
    
    // Spieler-Liste
    updatePlayersList();
    
    // Spielfeld
    updateBoard();
    
    // Handkarten
    updateHandCards();
    
    // Spielstatus
    if (currentGameState.gameStatus === 'waiting') {
        updateStatus('Warte auf Spielstart...', 'info');
        startGameBtn.disabled = Object.keys(currentGameState.players).length < 2;
    } else if (currentGameState.gameStatus === 'ended') {
        updateStatus('Spiel beendet!', 'warning');
        startGameBtn.disabled = false;
    }
}

function updatePlayersList() {
    if (!currentGameState) return;
    
    playersContainer.innerHTML = '';
    Object.values(currentGameState.players).forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.style.display = 'inline-block';
        playerDiv.style.margin = '0 10px';
        playerDiv.style.padding = '5px 10px';
        playerDiv.style.borderRadius = '4px';
        playerDiv.style.backgroundColor = player.id === myPlayerId ? '#d4edda' : '#f8f9fa';
        playerDiv.style.border = player.id === currentGameState.currentPlayer ? '2px solid #ff9800' : '1px solid #ddd';
        playerDiv.textContent = player.name + (player.id === myPlayerId ? ' (Du)' : '');
        playersContainer.appendChild(playerDiv);
    });
}

function updateBoard() {
    if (!currentGameState) return;
    
    // Alle Karten außer Achsenlinien und Zentrum entfernen
    const existingCards = gameBoard.querySelectorAll('.card');
    existingCards.forEach(card => card.remove());
    
    // Karten auf dem Board anzeigen
    Object.entries(currentGameState.board).forEach(([position, card]) => {
        const [x, y] = position.split(',').map(Number);
        const cardElement = createBoardCard(card, x, y);
        gameBoard.appendChild(cardElement);
    });
}

function createBoardCard(card, x, y) {
    const cardElement = document.createElement('div');
    cardElement.className = `card ${card.orientation}`;
    
    // Position berechnen (Zentrum des Boards als 0,0)
    const boardRect = gameBoard.getBoundingClientRect();
    const centerX = gameBoard.offsetWidth / 2;
    const centerY = gameBoard.offsetHeight / 2;
    const cardWidth = 100;
    const cardHeight = 140;
    const spacing = 20;
    
    const posX = centerX + (x * (cardWidth + spacing)) - (cardWidth / 2);
    const posY = centerY - (y * (cardHeight + spacing)) - (cardHeight / 2);
    
    cardElement.style.left = `${posX}px`;
    cardElement.style.top = `${posY}px`;
    
    cardElement.innerHTML = `
        <div>${card.name}</div>
        <div style="font-size: 10px; margin-top: 5px; color: #666;">
            ${card.metric_name}: ?
        </div>
        <div style="font-size: 8px; margin-top: 2px; color: #999;">
            ${card.orientation}
        </div>
    `;
    
    return cardElement;
}

function updateHandCards() {
    if (!currentGameState || !currentGameState.playerHand) return;
    
    handCards.innerHTML = '';
    
    currentGameState.playerHand.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = `hand-card ${card.orientation}`;
        if (selectedCard && selectedCard.id === card.id) {
            cardElement.classList.add('selected');
        }
        
        cardElement.innerHTML = `
            <div>${card.name}</div>
            <div style="font-size: 8px; margin-top: 5px; color: #666;">
                ${card.metric_name}: ?
            </div>
            <div style="font-size: 6px; margin-top: 2px; color: #999;">
                ${card.orientation}
            </div>
        `;
        
        cardElement.addEventListener('click', () => {
            // Vorherige Auswahl entfernen
            const prevSelected = handCards.querySelector('.selected');
            if (prevSelected) {
                prevSelected.classList.remove('selected');
            }
            
            // Neue Auswahl
            if (selectedCard && selectedCard.id === card.id) {
                selectedCard = null;
            } else {
                selectedCard = card;
                cardElement.classList.add('selected');
            }
            
            updatePlaceButton();
        });
        
        handCards.appendChild(cardElement);
    });
}

function updatePlaceButton() {
    const hasSelection = selectedCard !== null;
    const isMyTurn = currentGameState && currentGameState.currentPlayer === myPlayerId;
    const gameRunning = currentGameState && currentGameState.gameStatus === 'running';
    
    placeCardBtn.disabled = !(hasSelection && isMyTurn && gameRunning);
}

// Initialisierung
updateStatus('Verbinde zum Server...', 'info');
