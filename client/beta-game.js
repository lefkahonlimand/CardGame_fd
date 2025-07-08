// 🎯 UNIFIED DROP-ZONE SYSTEM - Core Calculator Class
class DropZoneCalculator {
    constructor(gameState) {
        this.gameState = gameState;
        this.board = gameState.board || {};
        this.boardPositions = new Set(Object.keys(this.board));
    }
    
    /**
     * Central method: Calculate ALL valid drop positions based on current game state
     * @returns {Array} Array of position objects with type and coordinates
     */
    calculateAllValidPositions() {
        const validPositions = [];
        
        // 🎯 STATE 1: Empty Board - Only origin allowed
        if (this.boardPositions.size === 0) {
            validPositions.push({
                x: 0,
                y: 0,
                type: 'origin',
                description: 'First card - origin position'
            });
            return validPositions;
        }
        
        // 🎯 STATE 2: Only origin card - Add 4 directions
        if (this.boardPositions.size === 1 && this.board['0,0']) {
            const directions = [
                { x: 1, y: 0, type: 'extension', axis: 'horizontal', description: 'Right from origin' },
                { x: -1, y: 0, type: 'extension', axis: 'horizontal', description: 'Left from origin' },
                { x: 0, y: 1, type: 'extension', axis: 'vertical', description: 'Up from origin' },
                { x: 0, y: -1, type: 'extension', axis: 'vertical', description: 'Down from origin' }
            ];
            validPositions.push(...directions);
            return validPositions;
        }
        
        // 🎯 STATE 3: Multiple cards - Calculate extensions and insertions
        this.addAxisExtensions(validPositions);
        this.addInsertionZones(validPositions);
        
        return validPositions;
    }
    
    /**
     * Add extension positions at the ends of existing axes
     */
    addAxisExtensions(validPositions) {
        const horizontalCards = this.getCardsOnAxis('horizontal');
        const verticalCards = this.getCardsOnAxis('vertical');
        
        // Horizontal axis extensions
        if (horizontalCards.length > 0) {
            const xPositions = horizontalCards.map(card => card.x).sort((a, b) => a - b);
            const leftMost = Math.min(...xPositions);
            const rightMost = Math.max(...xPositions);
            
            // Left extension
            const leftPos = `${leftMost - 1},0`;
            if (!this.boardPositions.has(leftPos)) {
                validPositions.push({
                    x: leftMost - 1,
                    y: 0,
                    type: 'extension',
                    axis: 'horizontal',
                    description: `Extend horizontal axis left`
                });
            }
            
            // Right extension
            const rightPos = `${rightMost + 1},0`;
            if (!this.boardPositions.has(rightPos)) {
                validPositions.push({
                    x: rightMost + 1,
                    y: 0,
                    type: 'extension',
                    axis: 'horizontal',
                    description: `Extend horizontal axis right`
                });
            }
        }
        
        // Vertical axis extensions
        if (verticalCards.length > 0) {
            const yPositions = verticalCards.map(card => card.y).sort((a, b) => a - b);
            const bottomMost = Math.min(...yPositions);
            const topMost = Math.max(...yPositions);
            
            // Bottom extension
            const bottomPos = `0,${bottomMost - 1}`;
            if (!this.boardPositions.has(bottomPos)) {
                validPositions.push({
                    x: 0,
                    y: bottomMost - 1,
                    type: 'extension',
                    axis: 'vertical',
                    description: `Extend vertical axis down`
                });
            }
            
            // Top extension
            const topPos = `0,${topMost + 1}`;
            if (!this.boardPositions.has(topPos)) {
                validPositions.push({
                    x: 0,
                    y: topMost + 1,
                    type: 'extension',
                    axis: 'vertical',
                    description: `Extend vertical axis up`
                });
            }
        }
    }
    
    /**
     * Add insertion positions between existing cards
     */
    addInsertionZones(validPositions) {
        const horizontalCards = this.getCardsOnAxis('horizontal');
        const verticalCards = this.getCardsOnAxis('vertical');
        
        // Horizontal insertions (between cards on x=?, y=0)
        if (horizontalCards.length >= 2) {
            horizontalCards.sort((a, b) => a.x - b.x);
            for (let i = 1; i < horizontalCards.length; i++) {
                const insertX = horizontalCards[i].x;
                const insertPos = `${insertX},0`;
                
                if (!this.boardPositions.has(insertPos)) {
                    validPositions.push({
                        x: insertX,
                        y: 0,
                        type: 'insertion',
                        axis: 'horizontal',
                        description: `Insert before card at (${insertX},0)`
                    });
                }
            }
        }
        
        // Vertical insertions (between cards on x=0, y=?)
        if (verticalCards.length >= 2) {
            verticalCards.sort((a, b) => a.y - b.y);
            for (let i = 1; i < verticalCards.length; i++) {
                const insertY = verticalCards[i].y;
                const insertPos = `0,${insertY}`;
                
                if (!this.boardPositions.has(insertPos)) {
                    validPositions.push({
                        x: 0,
                        y: insertY,
                        type: 'insertion',
                        axis: 'vertical',
                        description: `Insert before card at (0,${insertY})`
                    });
                }
            }
        }
    }
    
    /**
     * Get all cards on a specific axis
     */
    getCardsOnAxis(axis) {
        const cards = [];
        
        Object.entries(this.board).forEach(([position, card]) => {
            const [x, y] = position.split(',').map(Number);
            
            if (axis === 'horizontal' && y === 0) {
                cards.push({ x, y, position, card });
            } else if (axis === 'vertical' && x === 0) {
                cards.push({ x, y, position, card });
            }
        });
        
        return cards;
    }
}

// Game State Management
class GameManager {
    constructor() {
        this.socket = null;
        this.gameState = null;
        this.myPlayerId = null;
        this.draggedCard = null;
        this.dropZones = new Map();
        this.imageManager = new ImageManager(); // Add image manager
        this.debug = window.gameDebug; // Debug utilities reference
        
        this.debug?.logGameEvent('GameManager initializing');
        
        this.initializeElements();
        this.connectToServer();
        this.setupEventListeners();
        
        this.debug?.logGameEvent('GameManager initialized successfully');
    }
    
    // FIXED: Initialize zoom/pan functionality for game board
    initializeZoomPanFunctionality() {
        if (!this.elements.gameBoard) {
            console.error('Game board element not found for zoom/pan initialization');
            return;
        }
        
        // Initialize zoom/pan state
        this.zoomPanState = {
            scale: 1.0,
            translateX: 0,
            translateY: 0,
            isDragging: false,
            lastMouseX: 0,
            lastMouseY: 0,
            minScale: 0.3,
            maxScale: 3.0
        };
        
        // Center the game board initially
        this.centerGameBoard();
        
        // Setup zoom/pan event handlers
        this.setupZoomEventHandlers();
        this.setupPanEventHandlers();
        
        console.log('🔧 Zoom/Pan functionality initialized');
    }
    
    // FIXED: Center the game board to show coordinate origin (0,0)
    centerGameBoard() {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;
        
        // Reset zoom/pan to center position
        if (this.zoomPanState) {
            this.zoomPanState.scale = 1.0;
            this.zoomPanState.translateX = 0;
            this.zoomPanState.translateY = 0;
            
            this.applyTransform();
            
            console.log('🔧 Game board centered with zoom/pan system');
        }
    }
    
    // FIXED: Setup zoom event handlers (mouse wheel)
    setupZoomEventHandlers() {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;
        
        gameBoard.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const rect = gameBoard.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Calculate zoom factor
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.max(this.zoomPanState.minScale, 
                             Math.min(this.zoomPanState.maxScale, 
                                     this.zoomPanState.scale * zoomFactor));
            
            if (newScale !== this.zoomPanState.scale) {
                // Calculate zoom center point
                const scaleDiff = newScale / this.zoomPanState.scale;
                
                // Adjust translation to zoom towards mouse position
                this.zoomPanState.translateX = mouseX - (mouseX - this.zoomPanState.translateX) * scaleDiff;
                this.zoomPanState.translateY = mouseY - (mouseY - this.zoomPanState.translateY) * scaleDiff;
                this.zoomPanState.scale = newScale;
                
                this.applyTransform();
                
                console.log('🔍 Zoom:', {
                    scale: this.zoomPanState.scale.toFixed(2),
                    translateX: this.zoomPanState.translateX.toFixed(0),
                    translateY: this.zoomPanState.translateY.toFixed(0)
                });
            }
        });
    }
    
    // FIXED: Setup pan event handlers (mouse drag)
    setupPanEventHandlers() {
        const gameBoard = this.elements.gameBoard;
        if (!gameBoard) return;
        
        // Mouse down - start panning
        gameBoard.addEventListener('mousedown', (e) => {
            // Only pan with left mouse button and no modifier keys
            if (e.button === 0 && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                // Don't pan if clicking on a game element
                if (e.target.closest('.card, .drop-zone, .insertion-indicator, .floating-insertion-zone')) {
                    return;
                }
                
                this.zoomPanState.isDragging = true;
                this.zoomPanState.lastMouseX = e.clientX;
                this.zoomPanState.lastMouseY = e.clientY;
                
                gameBoard.style.cursor = 'grabbing';
                e.preventDefault();
                
                console.log('🖱️ Pan started');
            }
        });
        
        // Mouse move - pan if dragging
        gameBoard.addEventListener('mousemove', (e) => {
            if (this.zoomPanState.isDragging) {
                const deltaX = e.clientX - this.zoomPanState.lastMouseX;
                const deltaY = e.clientY - this.zoomPanState.lastMouseY;
                
                this.zoomPanState.translateX += deltaX;
                this.zoomPanState.translateY += deltaY;
                
                this.zoomPanState.lastMouseX = e.clientX;
                this.zoomPanState.lastMouseY = e.clientY;
                
                this.applyTransform();
                
                e.preventDefault();
            } else {
                // Show grab cursor when over pannable area
                if (!e.target.closest('.card, .drop-zone, .insertion-indicator, .floating-insertion-zone')) {
                    gameBoard.style.cursor = 'grab';
                } else {
                    gameBoard.style.cursor = '';
                }
            }
        });
        
        // Mouse up - stop panning
        gameBoard.addEventListener('mouseup', (e) => {
            if (this.zoomPanState.isDragging) {
                this.zoomPanState.isDragging = false;
                gameBoard.style.cursor = 'grab';
                
                console.log('🖱️ Pan ended:', {
                    translateX: this.zoomPanState.translateX.toFixed(0),
                    translateY: this.zoomPanState.translateY.toFixed(0)
                });
            }
        });
        
        // Mouse leave - stop panning
        gameBoard.addEventListener('mouseleave', (e) => {
            if (this.zoomPanState.isDragging) {
                this.zoomPanState.isDragging = false;
                gameBoard.style.cursor = '';
            }
        });
        
        // Prevent context menu on right click
        gameBoard.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    // Apply the current transform to all coordinated containers
    applyTransform() {
        const axisGrid = this.elements.gameBoard.querySelector('.axis-grid');
        const boardCards = this.elements.gameBoard.querySelector('.board-cards');
        const dropZones = this.elements.gameBoard.querySelector('.drop-zones');
        
        // FIXED: Coordinate all containers with same transform
        const transform = `translate(${this.zoomPanState.translateX}px, ${this.zoomPanState.translateY}px) scale(${this.zoomPanState.scale}) translate(-50%, -50%)`;
        
        if (axisGrid) {
            axisGrid.style.transform = transform;
        }
        if (boardCards) {
            boardCards.style.transform = transform;
        }
        if (dropZones) {
            dropZones.style.transform = transform;
        }
        
        // FIXED: Also apply to any insertion indicators
        const insertionIndicators = this.elements.gameBoard.querySelectorAll('.insertion-indicator, .floating-insertion-zone');
        insertionIndicators.forEach(indicator => {
            // These are positioned relative to the board, so they need the same transform
            indicator.parentElement.style.transform = transform;
        });
    }

    initializeElements() {
        // DOM Elements
        this.elements = {
            statusMessage: document.getElementById('status-message'),
            playerCount: document.getElementById('player-count'),
            currentPlayerInfo: document.getElementById('current-player-info'),
            deckCount: document.getElementById('deck-count'),
            startGameBtn: document.getElementById('start-game-btn'),
            gameBoard: document.getElementById('game-board'),
            dropZones: document.getElementById('drop-zones'),
            boardCards: document.getElementById('board-cards'),
            playerHand: document.getElementById('player-hand'),
            handCount: document.getElementById('hand-count'),
            notifications: document.getElementById('notifications'),
            gameEndModal: document.getElementById('game-end-modal'),
            modalTitle: document.getElementById('modal-title'),
            modalMessage: document.getElementById('modal-message'),
            cardReveal: document.getElementById('card-reveal'),
            newGameBtn: document.getElementById('new-game-btn'),
            // Game Menu Elements
            gameMenuBtn: document.getElementById('game-menu-btn'),
            gameMenuModal: document.getElementById('game-menu-modal'),
            restartGameBtn: document.getElementById('restart-game-btn'),
            endGameBtn: document.getElementById('end-game-btn'),
            refreshPageBtn: document.getElementById('refresh-page-btn'),
            closeMenuBtn: document.getElementById('close-menu-btn'),
            menuGameStatus: document.getElementById('menu-game-status'),
            menuConnectionStatus: document.getElementById('menu-connection-status')
        };
        
        // FIXED: Initialize zoom/pan functionality
        this.initializeZoomPanFunctionality();
    }

    connectToServer() {
        // Socket.IO Connection
        this.socket = io();
        this.debug?.logSocketEvent('Connecting to server');
        
        this.socket.on('connect', () => {
            this.myPlayerId = this.socket.id;
            this.debug?.logSocketReceive('connect', { playerId: this.myPlayerId });
            this.showNotification('Verbunden mit dem Server!', 'success');
            this.updateStatus('Verbunden! Warte auf andere Spieler...', 'success');
        });

        this.socket.on('disconnect', () => {
            this.debug?.logSocketReceive('disconnect', {});
            this.updateStatus('Verbindung getrennt!', 'error');
            this.showNotification('Verbindung zum Server verloren', 'error');
        });

        this.socket.on('gameState', (gameState) => {
            this.debug?.logSocketReceive('gameState', gameState);
            this.debug?.logGameState(gameState, 'received from server');
            
            // Update timestamp for stale event detection
            this.lastGameStateTime = Date.now();
            
            // ALWAYS close modal if game is running - regardless of previous state
            if (gameState.gameStatus === 'running' && this.elements.gameEndModal.style.display === 'flex') {
                this.debug?.logUIEvent('Game is running - force closing modal');
                this.hideModal();
            }
            
            // Check if game was restarted - close modal if open
            if (gameState.gameStatus === 'running' && this.gameState?.gameStatus === 'ended') {
                this.debug?.logUIEvent('Game restarted - closing modal automatically');
                this.hideModal();
            }
            
            this.gameState = gameState;
            this.updateGameDisplay();
        });

        this.socket.on('playerJoined', (data) => {
            this.debug?.logSocketReceive('playerJoined', data);
            this.showNotification(`${data.playerName} ist beigetreten`, 'info');
            this.updatePlayerCount(data.playerCount);
        });

        this.socket.on('playerLeft', (data) => {
            this.debug?.logSocketReceive('playerLeft', data);
            this.showNotification('Ein Spieler hat das Spiel verlassen', 'warning');
            this.updatePlayerCount(data.playerCount);
        });

        this.socket.on('roundEnd', (result) => {
            this.debug?.logSocketReceive('roundEnd', result);
            this.handleRoundEnd(result);
        });

        this.socket.on('error', (error) => {
            this.debug?.logSocketReceive('error', error);
            
            // Only log as error if it's not a game logic error
            if (error.message !== 'Spiel läuft nicht' && error.message !== 'Du bist nicht an der Reihe') {
                this.debug?.logError(new Error(error.message), { source: 'socket' });
            } else {
                this.debug?.logUIEvent('Game logic error: ' + error.message);
            }
            
            // Don't show notification for "game not running" errors during restart
            if (error.message !== 'Spiel läuft nicht') {
                this.showNotification(`Fehler: ${error.message}`, 'error');
            }
        });

        // Handle game state updates (additional broadcast for synchronization)
        this.socket.on('gameStateUpdate', (data) => {
            this.debug?.logSocketReceive('gameStateUpdate', data);
            if (data.gameStatus === 'running' && this.elements.gameEndModal.style.display === 'flex') {
                this.debug?.logUIEvent('Received gameStateUpdate - force closing modal');
                this.hideModal();
            }
        });
    }

    setupEventListeners() {
        // Start Game Button
        this.elements.startGameBtn.addEventListener('click', () => {
            this.debug?.logUIEvent('Start Game Button clicked', {
                disabled: this.elements.startGameBtn.disabled,
                gameStatus: this.gameState?.gameStatus,
                playerCount: this.gameState?.players ? Object.keys(this.gameState.players).length : 0
            });
            
            if (!this.elements.startGameBtn.disabled) {
                this.debug?.logSocketEmit('startGame', {});
                this.socket.emit('startGame');
            } else {
                this.debug?.logUIEvent('Start Game Button click ignored - button disabled');
            }
        });

        // New Game Button
        this.elements.newGameBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            this.debug?.logUIEvent('New Game Button clicked (from modal)', {
                buttonExists: !!this.elements.newGameBtn,
                disabled: this.elements.newGameBtn.disabled,
                pointerEvents: getComputedStyle(this.elements.newGameBtn).pointerEvents,
                zIndex: getComputedStyle(this.elements.newGameBtn).zIndex,
                socketConnected: this.socket?.connected,
                gameStatus: this.gameState?.gameStatus
            });
            
            // Force close modal immediately
            this.hideModal();
            
            // Request new game from server
            if (this.socket && this.socket.connected) {
                this.debug?.logSocketEmit('startGame', { source: 'modal', gameStatus: this.gameState?.gameStatus });
                this.socket.emit('startGame');
                this.showNotification('Neue Runde wird gestartet...', 'info');
            } else {
                this.debug?.logUIEvent('Cannot emit startGame - socket not connected');
                this.showNotification('Keine Verbindung zum Server', 'error');
            }
        });

        // Modal Click Outside
        this.elements.gameEndModal.addEventListener('click', (e) => {
            if (e.target === this.elements.gameEndModal) {
                this.hideModal();
            }
        });

        // Game Menu Event Listeners
        this.elements.gameMenuBtn.addEventListener('click', () => {
            this.debug?.logUIEvent('Game Menu Button clicked');
            this.showGameMenu();
        });

        this.elements.closeMenuBtn.addEventListener('click', () => {
            this.debug?.logUIEvent('Close Menu Button clicked');
            this.hideGameMenu();
        });

        this.elements.restartGameBtn.addEventListener('click', () => {
            this.debug?.logUIEvent('Restart Game Button clicked (from menu)', {
                gameStatus: this.gameState?.gameStatus,
                connected: this.socket?.connected
            });
            
            this.hideGameMenu();
            
            if (this.socket?.connected) {
                this.debug?.logSocketEmit('startGame', { source: 'menu-restart' });
                this.socket.emit('startGame');
                this.showNotification('Spiel wird neugestartet...', 'info');
            } else {
                this.debug?.logUIEvent('Restart Game Button - no socket connection');
                this.showNotification('Keine Verbindung zum Server', 'error');
            }
        });

        this.elements.refreshPageBtn.addEventListener('click', () => {
            if (confirm('Möchtest du die Seite wirklich neu laden? Alle ungespeicherten Daten gehen verloren.')) {
                window.location.reload();
            }
        });

        // Game Menu Modal Click Outside
        this.elements.gameMenuModal.addEventListener('click', (e) => {
            if (e.target === this.elements.gameMenuModal) {
                this.hideGameMenu();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.elements.gameMenuModal.style.display === 'flex') {
                    this.hideGameMenu();
                } else if (this.elements.gameEndModal.style.display === 'flex') {
                    this.hideModal();
                }
            }
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
                e.preventDefault();
                this.showGameMenu();
            }
        });
    }

    updateGameDisplay() {
        if (!this.gameState) return;

        // Force close modal if game is running (additional safety check)
        if (this.gameState.gameStatus === 'running' && this.elements.gameEndModal.style.display === 'flex') {
            this.debug?.logUIEvent('Force closing modal - game is running');
            this.hideModal();
        }

        // Update player count and info
        this.updatePlayerCount(Object.keys(this.gameState.players).length);
        this.updateCurrentPlayer();
        this.updateDeckCount();
        this.updatePlayerHand();
        this.updateBoard();
        this.updateStartButton();
    }

    updatePlayerCount(count) {
        const playerNames = this.gameState && this.gameState.players ? 
            Object.values(this.gameState.players).map(player => player.name).join(', ') : '';
        
        if (playerNames) {
            this.elements.playerCount.textContent = `${count} Spieler: ${playerNames}`;
        } else {
            this.elements.playerCount.textContent = `${count} Spieler`;
        }
        
        this.elements.startGameBtn.disabled = count < 2;
    }

    updateCurrentPlayer() {
        if (!this.gameState.currentPlayer) {
            this.elements.currentPlayerInfo.textContent = '';
            return;
        }

        const currentPlayerName = this.gameState.players[this.gameState.currentPlayer]?.name || 'Unbekannt';
        
        if (this.gameState.currentPlayer === this.myPlayerId) {
            this.updateStatus('Du bist an der Reihe!', 'warning');
            this.elements.currentPlayerInfo.textContent = 'Dein Zug';
            this.elements.currentPlayerInfo.className = 'current-player pulse-animation';
        } else {
            this.updateStatus(`${currentPlayerName} ist an der Reihe...`, 'info');
            this.elements.currentPlayerInfo.textContent = `Wartet auf ${currentPlayerName}`;
            this.elements.currentPlayerInfo.className = 'current-player';
        }
    }

    updateDeckCount() {
        this.elements.deckCount.textContent = this.gameState.deckCount || 0;
    }

    updateStatus(message, type = 'info') {
        this.elements.statusMessage.textContent = message;
        this.elements.statusMessage.className = `status-message ${type}`;
    }

    updateStartButton() {
        if (this.gameState.gameStatus === 'waiting') {
            this.elements.startGameBtn.style.display = 'block';
            this.elements.startGameBtn.disabled = Object.keys(this.gameState.players).length < 2;
        } else {
            this.elements.startGameBtn.style.display = 'none';
        }
    }

    updatePlayerHand() {
        const hand = this.gameState.playerHand || [];
        this.elements.handCount.textContent = `${hand.length} Karten`;
        
        // Clear existing hand cards
        this.elements.playerHand.innerHTML = '';
        
        hand.forEach((card, index) => {
            const cardElement = this.createHandCard(card, index);
            this.elements.playerHand.appendChild(cardElement);
            
            // Add draw animation
            setTimeout(() => {
                cardElement.classList.add('card-draw-animation');
            }, index * 100);
        });
    }

    createHandCard(card, index) {
        const cardElement = document.createElement('div');
        cardElement.className = `hand-card neutral`; // Keine feste Orientierung mehr
        cardElement.draggable = true;
        cardElement.dataset.cardId = card.id;
        cardElement.dataset.cardIndex = index;

        const placeholder = this.getCardPlaceholder(card);
        
        // Zeige nur verfügbare Achsen - NICHT die Werte (für Spannung!)
        let dimensionsText = '';
        if (card.height !== null && card.width !== null) {
            dimensionsText = 'H/B'; // Beide Achsen möglich
        } else if (card.height !== null) {
            dimensionsText = 'H'; // Nur vertikal
        } else if (card.width !== null) {
            dimensionsText = 'B'; // Nur horizontal
        } else {
            dimensionsText = '?'; // Keine Dimensionen
        }
        
        cardElement.innerHTML = `
            <div class="card-placeholder">${placeholder}</div>
            <div class="card-name">${card.name}</div>
            <div class="card-dimensions">${dimensionsText}</div>
        `;

        // Drag Event Listeners
        cardElement.addEventListener('dragstart', (e) => this.handleDragStart(e, card));
        cardElement.addEventListener('dragend', (e) => this.handleDragEnd(e));

        return cardElement;
    }

    getCardPlaceholder(card) {
        // Simple placeholder icons based on card names
        const placeholders = {
            'Eiffelturm': '🗼',
            'Burj Khalifa': '🏗️',
            'Empire State Building': '🏢',
            'Freiheitsstatue': '🗽',
            'Kolosseum': '🏛️',
            'Taj Mahal': '🕌',
            'Schiefer Turm von Pisa': '🏗️',
            'Giraffe': '🦒',
            'Mammutbaum': '🌲',
            'Schwarzer Panther': '🐆',
            'Sibirischer Tiger': '🐅',
            'Blauwal': '🐋',
            'Afrikanischer Elefant': '🐘',
            'Anaconda': '🐍',
            'Weißer Hai': '🦈',
            'Krokodil': '🐊',
            'Stadtbus': '🚌',
            'Boeing 747': '✈️',
            'Fußballfeld': '⚽'
        };
        
        return placeholders[card.name] || '📦';
    }

    updateBoard() {
        console.log('🔧 DEBUG: updateBoard called, board state:', this.gameState.board);
        
        // Clear existing board cards
        this.elements.boardCards.innerHTML = '';
        this.elements.dropZones.innerHTML = '';
        this.dropZones.clear();

        // Add board cards
        Object.entries(this.gameState.board).forEach(([position, card]) => {
            console.log('🔧 DEBUG: Creating board card at position:', position, 'card:', card.name);
            const [x, y] = position.split(',').map(Number);
            const cardElement = this.createBoardCard(card, x, y);
            this.elements.boardCards.appendChild(cardElement);
        });

        console.log('🔧 DEBUG: Board cards created, total:', Object.keys(this.gameState.board).length);

        // Generate drop zones if it's the player's turn
        if (this.gameState.currentPlayer === this.myPlayerId && this.gameState.gameStatus === 'running') {
            console.log('🔧 DEBUG: Generating drop zones for current player');
            this.generateDropZones();
        } else {
            console.log('🔧 DEBUG: Not generating drop zones - currentPlayer:', this.gameState.currentPlayer, 'myPlayerId:', this.myPlayerId, 'gameStatus:', this.gameState.gameStatus);
        }
    }

    createBoardCard(card, x, y) {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.orientation}`;
        
        const gridSize = 150;
        const cardWidth = 100;
        const cardHeight = 140;
        
        // FIXED: Position calculation for board-cards container coordinate system
        // The board-cards container is 4000px and centered, so we calculate from the center (2000px)
        const posX = (x * gridSize) + 2000 - (cardWidth / 2);
        const posY = (-y * gridSize) + 2000 - (cardHeight / 2);
        
        cardElement.style.left = `${posX}px`;
        cardElement.style.top = `${posY}px`;
        // Wichtig: Sehr niedrige z-index für Board-Karten, damit sie definitiv unter Popups liegen
        cardElement.style.zIndex = '3';
        cardElement.style.position = 'absolute';

        const placeholder = this.getCardPlaceholder(card);
        const metricValue = this.gameState.gameStatus === 'ended' ? card.metric_value : '?';
        const metricClass = this.gameState.gameStatus === 'ended' ? 'revealed' : '';
        
        cardElement.innerHTML = `
            <div class="card-placeholder">${placeholder}</div>
            <div class="card-name">${card.name}</div>
            <div class="card-metric ${metricClass}">${card.metric_name}: ${metricValue}</div>
            <div class="card-orientation">${card.orientation === 'hochformat' ? 'V' : 'H'}</div>
        `;

        // Add animation
        cardElement.classList.add('slide-in-animation');

        return cardElement;
    }

    generateDropZones() {
        console.log('🔧 DEBUG: generateDropZones called, board state:', Object.keys(this.gameState.board || {}).length);
        
        // FIXED: Always check if origin position (0,0) is empty and create drop zone
        if (!this.gameState.board || !this.gameState.board['0,0']) {
            console.log('🔧 DEBUG: Origin position (0,0) is empty - creating drop zone there');
            this.createUnifiedDropZone({
                x: 0,
                y: 0,
                type: 'origin',
                description: 'First card - origin position'
            });
            
            // If board is completely empty, only show origin drop zone
            if (!this.gameState.board || Object.keys(this.gameState.board).length === 0) {
                console.log('🔧 DEBUG: Board completely empty - only showing origin drop zone');
                return;
            }
        }

        const boardPositions = new Set(Object.keys(this.gameState.board));
        const possiblePositions = new Set();

    // 🎯 UNIFIED DROP-ZONE SYSTEM - Einheitliche Logik für alle Drop-Zones
        const dropZoneCalculator = new DropZoneCalculator(this.gameState);
        const validPositions = dropZoneCalculator.calculateAllValidPositions();
        
        console.log('🎯 DEBUG: Unified Drop-Zone System calculated positions:', validPositions);
        
        // Erstelle einheitliche Drop-Zones für alle gültigen Positionen
        validPositions.forEach(positionData => {
            this.createUnifiedDropZone(positionData);
        });
        
        console.log(`🎯 DEBUG: Created ${validPositions.length} unified drop zones`);
    }
    
    /**
     * 🎯 UNIFIED DROP ZONE CREATION - Single method for all drop zone types
     * Creates a visual drop zone based on position data from the calculator
     */
    createUnifiedDropZone(positionData) {
        const { x, y, type, axis, description } = positionData;
        
        const dropZone = document.createElement('div');
        dropZone.className = `drop-zone unified-drop-zone ${type}-zone`;
        dropZone.dataset.x = x;
        dropZone.dataset.y = y;
        dropZone.dataset.type = type;
        dropZone.dataset.axis = axis || 'none';
        dropZone.title = description; // Tooltip for debugging
        
        // Visual styling based on type
        this.styleDropZoneByType(dropZone, type);
        
        // Position calculation
        this.positionDropZone(dropZone, x, y);
        
        // Event handlers - same for all types
        this.attachDropZoneEvents(dropZone);
        
        // Add to DOM and tracking
        this.elements.dropZones.appendChild(dropZone);
        this.dropZones.set(`${x},${y}`, dropZone);
        
        console.log(`🎯 DEBUG: Created ${type} drop zone at (${x}, ${y}) - ${description}`);
    }
    
    /**
     * Style drop zones based on their type
     */
    styleDropZoneByType(dropZone, type) {
        // Base styles
        const baseStyle = {
            position: 'absolute',
            width: '100px',
            height: '140px',
            borderRadius: '8px',
            border: '2px dashed',
            zIndex: '3',
            transition: 'all 0.3s ease',
            opacity: '0.7',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
        };
        
        // Type-specific styles
        const typeStyles = {
            origin: {
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                borderColor: '#22c55e',
                content: '🎯'
            },
            extension: {
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: '#3b82f6',
                content: '➕'
            },
            insertion: {
                backgroundColor: 'rgba(249, 115, 22, 0.2)',
                borderColor: '#f97316',
                content: '📥'
            }
        };
        
        const style = { ...baseStyle, ...typeStyles[type] };
        
        // Apply styles
        Object.assign(dropZone.style, style);
        dropZone.textContent = style.content;
    }
    
    /**
     * Position drop zone in the game board
     */
    positionDropZone(dropZone, x, y) {
        const gridSize = 150;
        const cardWidth = 100;
        const cardHeight = 140;
        
        // FIXED: Position calculation for drop-zones container coordinate system
        // The drop-zones container is 4000px and centered, so we calculate from the center (2000px)
        const posX = (x * gridSize) + 2000 - (cardWidth / 2);
        const posY = (-y * gridSize) + 2000 - (cardHeight / 2);
        
        dropZone.style.left = `${posX}px`;
        dropZone.style.top = `${posY}px`;
    }
    
    /**
     * Attach unified event handlers to drop zones
     */
    attachDropZoneEvents(dropZone) {
        dropZone.addEventListener('dragover', (e) => this.handleUnifiedDragOver(e, dropZone));
        dropZone.addEventListener('dragenter', (e) => this.handleUnifiedDragEnter(e, dropZone));
        dropZone.addEventListener('dragleave', (e) => this.handleUnifiedDragLeave(e, dropZone));
        dropZone.addEventListener('drop', (e) => this.handleUnifiedDrop(e, dropZone));
    }
    
    /**
     * 🎯 UNIFIED DRAG & DROP HANDLERS - Handle all drop zone interactions
     */
    handleUnifiedDragOver(e, dropZone) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
    
    handleUnifiedDragEnter(e, dropZone) {
        e.preventDefault();
        const { x, y, type } = dropZone.dataset;
        
        dropZone.classList.add('active');
        
        // Client-side validation preview
        if (this.draggedCard) {
            const isValid = this.validateUnifiedCardPlacement(this.draggedCard, parseInt(x), parseInt(y), type);
            dropZone.classList.add(isValid ? 'valid' : 'invalid');
            
            // Enhanced visual feedback
            if (isValid) {
                dropZone.style.transform = 'scale(1.1)';
                dropZone.style.opacity = '0.9';
            } else {
                dropZone.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
                dropZone.style.borderColor = '#ef4444';
            }
        }
    }
    
    handleUnifiedDragLeave(e, dropZone) {
        dropZone.classList.remove('active', 'valid', 'invalid');
        dropZone.style.transform = 'scale(1)';
        dropZone.style.opacity = '0.7';
        
        // Reset type-specific styling
        const type = dropZone.dataset.type;
        this.styleDropZoneByType(dropZone, type);
    }
    
    handleUnifiedDrop(e, dropZone) {
        e.preventDefault();
        const { x, y, type } = dropZone.dataset;
        
        if (this.draggedCard) {
            const cardId = this.draggedCard.id;
            const placeAt = `${x},${y}`;
            
            console.log(`🎯 DEBUG: Unified drop - Card ${cardId} at ${placeAt}, type: ${type}`);
            
            // Determine if this is an insertion move
            const insertionMode = type === 'insertion';
            
            // Send to server with appropriate parameters
            const moveData = { cardId, placeAt };
            if (insertionMode) {
                moveData.insertionMode = true;
            }
            
            this.socket.emit('playerMove', moveData);
            
            // Visual feedback
            const draggedElement = document.querySelector(`[data-card-id="${cardId}"]`);
            if (draggedElement) {
                draggedElement.classList.add('card-play-animation');
            }
        }
        
        // Clean up
        this.handleUnifiedDragLeave(e, dropZone);
    }
    
    /**
     * 🎯 UNIFIED VALIDATION - Validate card placement for all drop zone types
     */
    validateUnifiedCardPlacement(card, x, y, type) {
        const position = `${x},${y}`;
        
        // Can't place on occupied position
        if (this.gameState.board[position]) {
            return false;
        }
        
        // Type-specific validation
        switch (type) {
            case 'origin':
                // Origin is always valid if empty
                return Object.keys(this.gameState.board).length === 0;
                
            case 'extension':
                // Extensions must extend existing axes
                return this.validateAxisExtension(card, x, y);
                
            case 'insertion':
                // Insertions must have adjacent cards for shifting
                return this.validateInsertion(card, x, y);
                
            default:
                return false;
        }
    }
    
    validateAxisExtension(card, x, y) {
        // Must be on an axis
        if (x !== 0 && y !== 0) {
            return false;
        }
        
        // Must have appropriate card dimensions
        if (y === 0 && (card.width === null || card.width === undefined)) {
            return false; // Horizontal axis needs width
        }
        if (x === 0 && (card.height === null || card.height === undefined)) {
            return false; // Vertical axis needs height
        }
        
        // Must have adjacent cards on the same axis
        const neighbors = [`${x+1},${y}`, `${x-1},${y}`, `${x},${y+1}`, `${x},${y-1}`];
        return neighbors.some(pos => this.gameState.board[pos]);
    }
    
    validateInsertion(card, x, y) {
        // Insertion requires cards that will be shifted
        // This is a simplified check - server will do the full validation
        const axisCards = this.getCardsOnSameAxis(x, y);
        return axisCards.length >= 2;
    }
    
    getCardsOnSameAxis(x, y) {
        const cards = [];
        Object.entries(this.gameState.board).forEach(([position, card]) => {
            const [cardX, cardY] = position.split(',').map(Number);
            if ((x === 0 && cardX === 0) || (y === 0 && cardY === 0)) {
                cards.push({ x: cardX, y: cardY, card });
            }
        });
        return cards;
    }
    
    // 🎯 LEGACY FUNCTIONS - Kept for gradual migration, will be removed
    generateRayExtensions(boardPositions, possiblePositions) {
        // Finde die Enden beider Strahlen
        const horizontalPositions = [];
        const verticalPositions = [];
        
        // Sammle alle Positionen auf den Achsen
        Object.keys(this.gameState.board).forEach(position => {
            const [x, y] = position.split(',').map(Number);
            if (y === 0) {
                horizontalPositions.push(x);
            }
            if (x === 0) {
                verticalPositions.push(y);
            }
        });
        
        // Sortiere die Positionen
        horizontalPositions.sort((a, b) => a - b);
        verticalPositions.sort((a, b) => a - b);
        
        // Erweitere horizontalen Strahl nur an den Enden
        if (horizontalPositions.length > 0) {
            const leftMost = Math.min(...horizontalPositions);
            const rightMost = Math.max(...horizontalPositions);
            
            // Linkes Ende erweitern (negativer x-Wert)
            const leftExtension = `${leftMost - 1},0`;
            if (!boardPositions.has(leftExtension)) {
                possiblePositions.add(leftExtension);
            }
            
            // Rechtes Ende erweitern (positiver x-Wert)
            const rightExtension = `${rightMost + 1},0`;
            if (!boardPositions.has(rightExtension)) {
                possiblePositions.add(rightExtension);
            }
        }
        
        // Erweitere vertikalen Strahl nur an den Enden
        if (verticalPositions.length > 0) {
            const bottomMost = Math.min(...verticalPositions);
            const topMost = Math.max(...verticalPositions);
            
            // Unteres Ende erweitern (negativer y-Wert)
            const bottomExtension = `0,${bottomMost - 1}`;
            if (!boardPositions.has(bottomExtension)) {
                possiblePositions.add(bottomExtension);
            }
            
            // Oberes Ende erweitern (positiver y-Wert)
            const topExtension = `0,${topMost + 1}`;
            if (!boardPositions.has(topExtension)) {
                possiblePositions.add(topExtension);
            }
        }
        
        // Falls es nur die Ursprungskarte gibt, erlaube alle 4 Richtungen
        if (Object.keys(this.gameState.board).length === 1 && this.gameState.board['0,0']) {
            console.log('🔧 DEBUG: Only origin card present, adding 4 directional drop zones');
            ['1,0', '-1,0', '0,1', '0,-1'].forEach(pos => {
                if (!boardPositions.has(pos)) {
                    console.log(`🔧 DEBUG: Adding directional drop zone: ${pos}`);
                    possiblePositions.add(pos);
                }
            });
        }
    }
    
    generateFloatingInsertionZones(boardPositions, possiblePositions) {
        console.log('🔧 DEBUG: generateFloatingInsertionZones called');
        
        // Sammle alle Karten auf der horizontalen Achse (y=0)
        const horizontalCards = [];
        Object.keys(this.gameState.board).forEach(position => {
            const [x, y] = position.split(',').map(Number);
            if (y === 0) {
                horizontalCards.push({ x, position });
            }
        });
        
        // Sammle alle Karten auf der vertikalen Achse (x=0)
        const verticalCards = [];
        Object.keys(this.gameState.board).forEach(position => {
            const [x, y] = position.split(',').map(Number);
            if (x === 0) {
                verticalCards.push({ y, position });
            }
        });
        
        console.log('🔧 DEBUG: Found horizontal cards:', horizontalCards.length);
        console.log('🔧 DEBUG: Found vertical cards:', verticalCards.length);
        
        // Erstelle Floating Insertion-Zones zwischen ALLEN aufeinanderfolgenden Karten
        
        // 1. Horizontale Insertion-Zones
        if (horizontalCards.length >= 2) {
            horizontalCards.sort((a, b) => a.x - b.x);
            console.log('🔧 DEBUG: Sorted horizontal cards:', horizontalCards.map(c => c.x));
            
            for (let i = 0; i < horizontalCards.length - 1; i++) {
                const current = horizontalCards[i];
                const next = horizontalCards[i + 1];
                
                // Erstelle "Floating" Position zwischen den Karten
                // Verwende den Mittelpunkt als "virtuelle" Position
                const floatingX = (current.x + next.x) / 2;
                const floatingPos = `${floatingX},0`;
                
                console.log(`🔧 DEBUG: Adding floating horizontal insertion between ${current.x} and ${next.x}: ${floatingPos}`);
                possiblePositions.add(floatingPos);
            }
        }
        
        // 2. Vertikale Insertion-Zones
        if (verticalCards.length >= 2) {
            verticalCards.sort((a, b) => a.y - b.y);
            console.log('🔧 DEBUG: Sorted vertical cards:', verticalCards.map(c => c.y));
            
            for (let i = 0; i < verticalCards.length - 1; i++) {
                const current = verticalCards[i];
                const next = verticalCards[i + 1];
                
                // Erstelle "Floating" Position zwischen den Karten
                // Verwende den Mittelpunkt als "virtuelle" Position
                const floatingY = (current.y + next.y) / 2;
                const floatingPos = `0,${floatingY}`;
                
                console.log(`🔧 DEBUG: Adding floating vertical insertion between ${current.y} and ${next.y}: ${floatingPos}`);
                possiblePositions.add(floatingPos);
            }
        }
        
        console.log(`🔧 DEBUG: Generated ${possiblePositions.size} total drop zones (including floating insertion zones)`);
    }
    
    generateInsertionZones(boardPositions, possiblePositions) {
        // Finde alle möglichen Einfügepositionen zwischen Karten auf beiden Achsen
        this.addHorizontalInsertionZones(boardPositions, possiblePositions);
        this.addVerticalInsertionZones(boardPositions, possiblePositions);
    }
    
    addHorizontalInsertionZones(boardPositions, possiblePositions) {
        console.log('🔧 DEBUG: addHorizontalInsertionZones called');
        
        // Sammle alle horizontalen X-Positionen (y=0)
        const horizontalXPositions = [];
        Object.keys(this.gameState.board).forEach(position => {
            const [x, y] = position.split(',').map(Number);
            if (y === 0) {
                horizontalXPositions.push(x);
            }
        });
        
        if (horizontalXPositions.length < 2) {
            console.log('🔧 DEBUG: Less than 2 horizontal cards, no insertion zones needed');
            return;
        }
        
        // Sortiere die X-Positionen
        horizontalXPositions.sort((a, b) => a - b);
        console.log('🔧 DEBUG: Horizontal X positions:', horizontalXPositions);
        
        // NEUER ANSATZ: Füge Insertion-Zones VOR jeder Karte hinzu (außer der ersten)
        // Das Konzept: Wenn wir VOR einer Karte einfügen, verschieben sich alle Karten ab dort nach rechts
        for (let i = 1; i < horizontalXPositions.length; i++) {
            const insertBeforeX = horizontalXPositions[i];
            const insertPos = `${insertBeforeX},0`;
            
            console.log(`🔧 DEBUG: Adding insertion zone BEFORE card at ${insertBeforeX}: ${insertPos}`);
            
            // Diese Position wird von der Karte weggenommen, sobald eine neue Karte eingefügt wird
            // (Die Server-Logik wird alle Karten ab dieser Position nach rechts verschieben)
            possiblePositions.add(insertPos);
        }
        
        console.log(`🔧 DEBUG: Added ${horizontalXPositions.length - 1} horizontal insertion zones`);
    }
    
    addVerticalInsertionZones(boardPositions, possiblePositions) {
        console.log('🔧 DEBUG: addVerticalInsertionZones called');
        
        // Sammle alle vertikalen Y-Positionen (x=0)
        const verticalYPositions = [];
        Object.keys(this.gameState.board).forEach(position => {
            const [x, y] = position.split(',').map(Number);
            if (x === 0) {
                verticalYPositions.push(y);
            }
        });
        
        if (verticalYPositions.length < 2) {
            console.log('🔧 DEBUG: Less than 2 vertical cards, no insertion zones needed');
            return;
        }
        
        // Sortiere die Y-Positionen
        verticalYPositions.sort((a, b) => a - b);
        console.log('🔧 DEBUG: Vertical Y positions:', verticalYPositions);
        
        // NEUER ANSATZ: Füge Insertion-Zones VOR jeder Karte hinzu (außer der ersten)
        // Das Konzept: Wenn wir VOR einer Karte einfügen, verschieben sich alle Karten ab dort nach oben
        for (let i = 1; i < verticalYPositions.length; i++) {
            const insertBeforeY = verticalYPositions[i];
            const insertPos = `0,${insertBeforeY}`;
            
            console.log(`🔧 DEBUG: Adding insertion zone BEFORE card at ${insertBeforeY}: ${insertPos}`);
            
            // Diese Position wird von der Karte weggenommen, sobald eine neue Karte eingefügt wird
            // (Die Server-Logik wird alle Karten ab dieser Position nach oben verschieben)
            possiblePositions.add(insertPos);
        }
        
        console.log(`🔧 DEBUG: Added ${verticalYPositions.length - 1} vertical insertion zones`);
    }

    findCardSequences(direction) {
        const sequences = [];
        const processedPositions = new Set();
        
        Object.keys(this.gameState.board).forEach(position => {
            if (processedPositions.has(position)) return;
            
            const [x, y] = position.split(',').map(Number);
            const card = this.gameState.board[position];
            
            // Check if this card should be part of a sequence in this direction
            const isValidForDirection = 
                (direction === 'horizontal' && card.orientation === 'querformat') ||
                (direction === 'vertical' && card.orientation === 'hochformat');
                
            if (!isValidForDirection) return;
            
            // Find all cards in this sequence
            const sequence = this.traceSequence(x, y, direction, processedPositions);
            if (sequence.cards.length > 0) {
                sequences.push(sequence);
            }
        });
        
        return sequences;
    }

    traceSequence(startX, startY, direction, processedPositions) {
        const sequence = { direction, cards: [] };
        const deltaX = direction === 'horizontal' ? 1 : 0;
        const deltaY = direction === 'vertical' ? 1 : 0;
        
        // Find the leftmost/topmost position in the sequence
        let currentX = startX;
        let currentY = startY;
        
        // Go backwards to find the start
        while (true) {
            const prevX = currentX - deltaX;
            const prevY = currentY - deltaY;
            const prevPos = `${prevX},${prevY}`;
            const prevCard = this.gameState.board[prevPos];
            
            if (prevCard && 
                ((direction === 'horizontal' && prevCard.orientation === 'querformat') ||
                 (direction === 'vertical' && prevCard.orientation === 'hochformat'))) {
                currentX = prevX;
                currentY = prevY;
            } else {
                break;
            }
        }
        
        // Now trace forward from the start
        while (true) {
            const pos = `${currentX},${currentY}`;
            const card = this.gameState.board[pos];
            
            if (card && 
                ((direction === 'horizontal' && card.orientation === 'querformat') ||
                 (direction === 'vertical' && card.orientation === 'hochformat'))) {
                sequence.cards.push({ x: currentX, y: currentY, card, position: pos });
                processedPositions.add(pos);
                currentX += deltaX;
                currentY += deltaY;
            } else {
                break;
            }
        }
        
        return sequence;
    }

    addInsertionZonesForSequence(sequence, possiblePositions) {
        // Add zones between each pair of consecutive cards
        for (let i = 0; i < sequence.cards.length - 1; i++) {
            const current = sequence.cards[i];
            const next = sequence.cards[i + 1];
            
            // Check if there's exactly one gap between current and next
            const gapX = (current.x + next.x) / 2;
            const gapY = (current.y + next.y) / 2;
            
            // Only add if it's a perfect integer gap (cards are adjacent with one space)
            if (Number.isInteger(gapX) && Number.isInteger(gapY)) {
                const gapPos = `${gapX},${gapY}`;
                if (!this.gameState.board[gapPos]) {
                    possiblePositions.add(gapPos);
                }
            }
        }
    }

    createDropZone(x, y) {
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        dropZone.dataset.x = x;
        dropZone.dataset.y = y;

        const gridSize = 150;
        const cardWidth = 100;
        const cardHeight = 140;
        
        const posX = (x * gridSize) + (this.elements.gameBoard.offsetWidth / 2) - (cardWidth / 2);
        const posY = (-y * gridSize) + (this.elements.gameBoard.offsetHeight / 2) - (cardHeight / 2);
        
        dropZone.style.left = `${posX}px`;
        dropZone.style.top = `${posY}px`;

        // Drag and Drop Event Listeners
        dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        dropZone.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        dropZone.addEventListener('drop', (e) => this.handleDrop(e));

        this.elements.dropZones.appendChild(dropZone);
        this.dropZones.set(`${x},${y}`, dropZone);
    }

    // Drag and Drop Handlers
    handleDragStart(e, card) {
        this.draggedCard = card;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.id);
        
        // Generiere dynamische Insertion-Zones beim Drag-Start
        this.showInsertionIndicators();
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedCard = null;
        
        // Reset all drop zones
        this.dropZones.forEach(zone => {
            zone.classList.remove('active', 'valid', 'invalid');
        });
        
        // Verstecke alle dynamischen Insertion-Indikatoren
        this.hideInsertionIndicators();
    }
    
    showInsertionIndicators() {
        console.log('🔧 DEBUG: showInsertionIndicators() called');
        
        // Entferne existierende Insertion-Indikatoren
        this.hideInsertionIndicators();
        
        if (!this.gameState.board || Object.keys(this.gameState.board).length === 0) {
            console.log('🔧 DEBUG: Board is empty, creating insertion indicator at origin (0,0)');
            // Wenn Board leer ist, zeige nur die Ursprungsposition (0,0) als Drop-Zone
            this.createInsertionIndicator(0, 0);
            return;
        }
        
        console.log('🔧 DEBUG: Board state:', Object.keys(this.gameState.board));
        
        // Erstelle Insertion-Zones zwischen allen Karten
        const insertionPositions = new Set();
        
        // NEUE LOGIK: Falls es nur die Ursprungskarte gibt, erlaube alle 4 Richtungen (genau wie bei generateDropZones)
        if (Object.keys(this.gameState.board).length === 1 && this.gameState.board['0,0']) {
            console.log('🔧 DEBUG: Only origin card present for insertion indicators, adding 4 directional indicators');
            ['1,0', '-1,0', '0,1', '0,-1'].forEach(pos => {
                const [x, y] = pos.split(',').map(Number);
                console.log(`🔧 DEBUG: Adding directional insertion indicator: ${pos}`);
                this.createInsertionIndicator(x, y);
            });
            return;
        }
        
        this.addHorizontalInsertionZones(new Set(Object.keys(this.gameState.board)), insertionPositions);
        this.addVerticalInsertionZones(new Set(Object.keys(this.gameState.board)), insertionPositions);
        
        console.log('🔧 DEBUG: Insertion positions found:', Array.from(insertionPositions));
        
        if (insertionPositions.size === 0) {
            console.log('🔧 DEBUG: NO insertion positions found - investigating...');
            // Debug horizontal cards
            const horizontalCards = [];
            Object.keys(this.gameState.board).forEach(position => {
                const [x, y] = position.split(',').map(Number);
                if (y === 0) {
                    horizontalCards.push({ x, position, card: this.gameState.board[position] });
                }
            });
            console.log('🔧 DEBUG: Horizontal cards found:', horizontalCards);
            
            // Debug vertical cards
            const verticalCards = [];
            Object.keys(this.gameState.board).forEach(position => {
                const [x, y] = position.split(',').map(Number);
                if (x === 0) {
                    verticalCards.push({ y, position, card: this.gameState.board[position] });
                }
            });
            console.log('🔧 DEBUG: Vertical cards found:', verticalCards);
        }
        
        // Erstelle visuelle Indikatoren für jede Insertion-Position
        insertionPositions.forEach(position => {
            const [x, y] = position.split(',').map(Number);
            console.log(`🔧 DEBUG: Creating insertion indicator at (${x}, ${y})`);
            this.createInsertionIndicator(x, y);
        });
        
        console.log(`🔧 DEBUG: Created ${insertionPositions.size} insertion indicators`);
    }
    
    hideInsertionIndicators() {
        // Entferne alle Insertion-Indikatoren
        const indicators = this.elements.gameBoard.querySelectorAll('.insertion-indicator');
        indicators.forEach(indicator => indicator.remove());
    }
    
    createInsertionIndicator(x, y) {
        const indicator = document.createElement('div');
        indicator.className = 'insertion-indicator';
        indicator.dataset.x = x;
        indicator.dataset.y = y;
        
        const gridSize = 150;
        const indicatorSize = 20;
        
        // FIXED: Position calculation for drop-zones container coordinate system
        // The drop-zones container is 4000px and centered, so we calculate from the center (2000px)
        const posX = (x * gridSize) + 2000 - (indicatorSize / 2);
        const posY = (-y * gridSize) + 2000 - (indicatorSize / 2);
        
        indicator.style.left = `${posX}px`;
        indicator.style.top = `${posY}px`;
        indicator.style.width = `${indicatorSize}px`;
        indicator.style.height = `${indicatorSize}px`;
        indicator.style.position = 'absolute';
        indicator.style.backgroundColor = 'rgba(37, 99, 235, 0.3)';
        indicator.style.border = '2px dashed var(--primary)';
        indicator.style.borderRadius = '50%';
        indicator.style.zIndex = '5';
        indicator.style.transition = 'all 0.2s ease';
        indicator.style.opacity = '0.7';
        indicator.style.pointerEvents = 'auto';
        
        // Hover-Effekt
        indicator.addEventListener('mouseenter', () => {
            indicator.style.transform = 'scale(1.5)';
            indicator.style.backgroundColor = 'rgba(37, 99, 235, 0.6)';
            indicator.style.opacity = '1';
        });
        
        indicator.addEventListener('mouseleave', () => {
            indicator.style.transform = 'scale(1)';
            indicator.style.backgroundColor = 'rgba(37, 99, 235, 0.3)';
            indicator.style.opacity = '0.7';
        });
        
        // Drop-Funktionalität
        indicator.addEventListener('dragover', (e) => this.handleDragOver(e));
        indicator.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        indicator.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        indicator.addEventListener('drop', (e) => {
            e.preventDefault();
            const x = parseInt(indicator.dataset.x);
            const y = parseInt(indicator.dataset.y);
            
            if (this.draggedCard) {
                const cardId = this.draggedCard.id;
                const placeAt = `${x},${y}`;
                
                // Send move to server
                this.socket.emit('playerMove', { cardId, placeAt });
            }
        });
        
        // FIXED: Add to drop-zones container instead of game-board
        this.elements.dropZones.appendChild(indicator);
    }
    
    createFloatingInsertionZone(x, y, originalPosition) {
        console.log(`🔧 DEBUG: Creating floating insertion zone at (${x}, ${y}) for position ${originalPosition}`);
        
        const zone = document.createElement('div');
        zone.className = 'floating-insertion-zone';
        zone.dataset.floatingX = x;
        zone.dataset.floatingY = y;
        zone.dataset.originalPosition = originalPosition;
        
        const gridSize = 150;
        const zoneSize = 30; // Größer als normale Insertion-Indicators
        
        // Position berechnen - für Floating-Positionen
        const posX = (x * gridSize) + (this.elements.gameBoard.offsetWidth / 2) - (zoneSize / 2);
        const posY = (-y * gridSize) + (this.elements.gameBoard.offsetHeight / 2) - (zoneSize / 2);
        
        zone.style.left = `${posX}px`;
        zone.style.top = `${posY}px`;
        zone.style.width = `${zoneSize}px`;
        zone.style.height = `${zoneSize}px`;
        zone.style.position = 'absolute';
        zone.style.backgroundColor = 'rgba(255, 165, 0, 0.3)'; // Orange für Insertion-Zones
        zone.style.border = '3px dashed orange';
        zone.style.borderRadius = '50%';
        zone.style.zIndex = '6'; // Höher als normale Drop-Zones
        zone.style.transition = 'all 0.3s ease';
        zone.style.opacity = '0.8';
        zone.style.cursor = 'pointer';
        
        // Spezielle Animation für Floating-Zones
        zone.style.animation = 'floating-pulse 2s infinite';
        
        // Hover-Effekt
        zone.addEventListener('mouseenter', () => {
            zone.style.transform = 'scale(1.3)';
            zone.style.backgroundColor = 'rgba(255, 165, 0, 0.7)';
            zone.style.opacity = '1';
        });
        
        zone.addEventListener('mouseleave', () => {
            zone.style.transform = 'scale(1)';
            zone.style.backgroundColor = 'rgba(255, 165, 0, 0.3)';
            zone.style.opacity = '0.8';
        });
        
        // Drop-Funktionalität für Floating-Zones
        zone.addEventListener('dragover', (e) => this.handleDragOver(e));
        zone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            zone.classList.add('active');
            zone.style.backgroundColor = 'rgba(255, 165, 0, 0.9)';
        });
        zone.addEventListener('dragleave', (e) => {
            zone.classList.remove('active');
            zone.style.backgroundColor = 'rgba(255, 165, 0, 0.3)';
        });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            
            if (this.draggedCard) {
                const cardId = this.draggedCard.id;
                
                console.log(`🔧 DEBUG: Dropping card ${cardId} at floating position ${originalPosition}`);
                
                // Für Floating-Positionen: Sende die ursprüngliche Position (mit Dezimalzahlen)
                // Der Server wird verstehen, dass das eine Insertion-Position ist
                this.socket.emit('playerMove', { cardId, placeAt: originalPosition, insertionMode: true });
            }
            
            zone.classList.remove('active');
            zone.style.backgroundColor = 'rgba(255, 165, 0, 0.3)';
        });
        
        this.elements.gameBoard.appendChild(zone);
        
        // CSS Animation für Floating-Zones hinzufügen (falls noch nicht vorhanden)
        if (!document.getElementById('floating-zone-styles')) {
            const style = document.createElement('style');
            style.id = 'floating-zone-styles';
            style.textContent = `
                @keyframes floating-pulse {
                    0%, 100% { transform: scale(1) rotate(0deg); }
                    50% { transform: scale(1.1) rotate(5deg); }
                }
                .floating-insertion-zone.active {
                    animation: none;
                    transform: scale(1.4) !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(e) {
        e.preventDefault();
        const dropZone = e.target;
        dropZone.classList.add('active');
        
        // Validate drop position
        if (this.draggedCard) {
            const x = parseInt(dropZone.dataset.x);
            const y = parseInt(dropZone.dataset.y);
            const isValid = this.validateCardPlacement(this.draggedCard, x, y);
            
            dropZone.classList.add(isValid ? 'valid' : 'invalid');
        }
    }

    handleDragLeave(e) {
        const dropZone = e.target;
        dropZone.classList.remove('active', 'valid', 'invalid');
    }

    handleDrop(e) {
        e.preventDefault();
        const dropZone = e.target;
        const x = parseInt(dropZone.dataset.x);
        const y = parseInt(dropZone.dataset.y);
        
        if (this.draggedCard) {
            const cardId = this.draggedCard.id;
            const placeAt = `${x},${y}`;
            
            // Send move to server
            this.socket.emit('playerMove', { cardId, placeAt });
            
            // Add play animation to the dragged card
            const draggedElement = document.querySelector(`[data-card-id="${cardId}"]`);
            if (draggedElement) {
                draggedElement.classList.add('card-play-animation');
            }
        }
        
        // Clean up
        dropZone.classList.remove('active', 'valid', 'invalid');
    }

    validateCardPlacement(card, x, y) {
        // Simple client-side validation (server will do the real validation)
        const position = `${x},${y}`;
        
        // Can't place on occupied position
        if (this.gameState.board[position]) {
            return false;
        }
        
        // First card can be placed anywhere (Origin)
        if (Object.keys(this.gameState.board).length === 0) {
            return true;
        }
        
        // Bestimme Orientierung basierend auf Position
        let cardOrientation;
        if (x === 0 && y === 0) {
            return false; // Ursprungsposition bereits belegt
        } else if (y === 0) {
            cardOrientation = 'querformat'; // Horizontale Achse
        } else if (x === 0) {
            cardOrientation = 'hochformat'; // Vertikale Achse
        } else {
            return false; // Außerhalb der Kreuz-Achsen
        }
        
        // Prüfe ob mindestens eine benachbarte Karte existiert
        const allNeighbors = [`${x+1},${y}`, `${x-1},${y}`, `${x},${y+1}`, `${x},${y-1}`];
        let hasAnyNeighbor = false;
        for (let pos of allNeighbors) {
            if (this.gameState.board[pos]) {
                hasAnyNeighbor = true;
                break;
            }
        }
        
        if (!hasAnyNeighbor) {
            return false; // Muss neben einer Karte platziert werden
        }
        
        // Kreuz-Layout: Prüfe Orientierungskompatibilität
        if (cardOrientation === 'hochformat') {
            // Vertikale Karten: dürfen nicht horizontal neben andere Karten (außer Ursprungskarte)
            const horizontalNeighbors = [`${x+1},${y}`, `${x-1},${y}`];
            for (let pos of horizontalNeighbors) {
                const neighbor = this.gameState.board[pos];
                if (neighbor && neighbor.orientation !== 'origin') {
                    return false; // Verbot: horizontal neben anderen Karten (außer origin)
                }
            }
            return true; // Erlaubt: nur vertikale Nachbarn oder Ursprungskarte
        } else if (cardOrientation === 'querformat') {
            // Horizontale Karten: dürfen nicht vertikal neben andere Karten (außer Ursprungskarte)
            const verticalNeighbors = [`${x},${y+1}`, `${x},${y-1}`];
            for (let pos of verticalNeighbors) {
                const neighbor = this.gameState.board[pos];
                if (neighbor && neighbor.orientation !== 'origin') {
                    return false; // Verbot: vertikal neben anderen Karten (außer origin)
                }
            }
            return true; // Erlaubt: nur horizontale Nachbarn oder Ursprungskarte
        }
        
        return false;
    }

    getAdjacentCards(x, y, orientation) {
        let positions = [];
        
        if (orientation === 'hochformat') {
            // Vertical adjacent positions
            positions = [`${x},${y + 1}`, `${x},${y - 1}`];
        } else {
            // Horizontal adjacent positions
            positions = [`${x + 1},${y}`, `${x - 1},${y}`];
        }
        
        return positions.filter(pos => {
            const boardCard = this.gameState.board[pos];
            return boardCard && boardCard.orientation === orientation;
        });
    }

    handleRoundEnd(result) {
        this.debug?.logGameEvent('Round ended', {
            loser: result.loser,
            loserName: result.loserName,
            reason: result.reason,
            cardPlayed: result.cardPlayed?.name,
            isMyLoss: result.loser === this.myPlayerId
        });
        
        // Check if we already have a modal open - ignore duplicate events
        if (this.elements.gameEndModal.style.display === 'flex') {
            this.debug?.logUIEvent('Ignoring duplicate roundEnd - modal already open');
            return;
        }
        
        // NEUE LOGIK: Prüfe den gameStatus - bei 'running' ist es ein echter Fehler!
        // Nur bei 'ended' UND einem sehr alten Event ignorieren wir es
        if (this.gameState && this.gameState.gameStatus === 'ended') {
            const now = Date.now();
            const timeSinceLastUpdate = now - (this.lastGameStateTime || 0);
            this.debug?.logUIEvent(`Game already ended, time since last update: ${timeSinceLastUpdate}ms`);
            
            if (timeSinceLastUpdate > 5000) {
                this.debug?.logUIEvent('Ignoring very old roundEnd - game was already ended');
                return;
            }
        }
        
        // Wenn gameStatus 'running' ist, ist das ein aktueller Fehler - Modal anzeigen!
        this.debug?.logUIEvent('Showing modal for current round end event');
        
        // Show end game modal
        if (result.loser === this.myPlayerId) {
            this.elements.modalTitle.textContent = 'Du hast verloren! 😞';
            this.elements.modalMessage.innerHTML = `
                <p><strong>Grund:</strong> ${result.reason}</p>
                <p>Du hast versucht zu spielen: <strong>${result.cardPlayed.name}</strong></p>
            `;
        } else {
            this.elements.modalTitle.textContent = 'Runde beendet! 🎉';
            this.elements.modalMessage.innerHTML = `
                <p><strong>${result.loserName}</strong> hat einen Fehler gemacht.</p>
                <p><strong>Grund:</strong> ${result.reason}</p>
                <p>Gespielte Karte: <strong>${result.cardPlayed.name}</strong></p>
            `;
        }

        // Show card reveal
        this.showCardReveal(result.cardPlayed);
        
        // Animate card reveals on board
        this.animateCardReveal();
        
        // Show modal
        this.showModal();
    }

    showCardReveal(playedCard) {
        this.elements.cardReveal.innerHTML = '';
        
        const cardElement = document.createElement('div');
        cardElement.className = `card ${playedCard.orientation}`;
        
        const placeholder = this.getCardPlaceholder(playedCard);
        
        cardElement.innerHTML = `
            <div class="card-placeholder">${placeholder}</div>
            <div class="card-name">${playedCard.name}</div>
            <div class="card-metric revealed">${playedCard.metric_name}: ${playedCard.metric_value}</div>
            <div class="card-orientation">${playedCard.orientation === 'hochformat' ? 'V' : 'H'}</div>
        `;
        
        cardElement.classList.add('card-reveal-animation');
        this.elements.cardReveal.appendChild(cardElement);
    }

    animateCardReveal() {
        // Animate all board cards to reveal their values
        const boardCards = this.elements.boardCards.querySelectorAll('.card');
        boardCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('card-reveal-animation');
                const metric = card.querySelector('.card-metric');
                if (metric) {
                    metric.classList.add('revealed');
                }
            }, index * 200);
        });
    }

    showModal() {
        this.debug?.logUIEvent('Showing game end modal');
        
        // Disable all game interactions
        this.disableGameInteractions();
        this.elements.gameEndModal.style.display = 'flex';
        
        // Force pointer events and clear any drag states
        document.body.style.cursor = 'default';
        this.draggedCard = null;
        
        // Ensure modal and button are clickable
        this.elements.gameEndModal.style.pointerEvents = 'auto';
        this.elements.gameEndModal.style.zIndex = '9999';
        this.elements.newGameBtn.style.pointerEvents = 'auto';
        this.elements.newGameBtn.disabled = false;
        
        // Remove any overlaying elements
        document.querySelectorAll('.drop-zone').forEach(zone => {
            zone.style.zIndex = '1';
        });
        
        this.debug?.logUIEvent('Modal CSS properties set', {
            display: this.elements.gameEndModal.style.display,
            pointerEvents: this.elements.gameEndModal.style.pointerEvents,
            zIndex: this.elements.gameEndModal.style.zIndex,
            buttonDisabled: this.elements.newGameBtn.disabled
        });
        
        // Force all overlays to be below the modal
        document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.zIndex && parseInt(style.zIndex) > 2000) {
                el.style.zIndex = '1';
            }
        });
        
        // Focus the modal for accessibility and ensure button works
        setTimeout(() => {
            this.debug?.logUIEvent('Setting up button event handlers', {
                buttonExists: !!this.elements.newGameBtn,
                buttonId: this.elements.newGameBtn?.id,
                buttonDisabled: this.elements.newGameBtn?.disabled,
                modalDisplay: this.elements.gameEndModal.style.display
            });
            
            // Button click handler
            const handleButtonClick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                this.debug?.logUIEvent('BUTTON CLICKED!', {
                    eventType: e.type,
                    socketConnected: this.socket?.connected,
                    gameStatus: this.gameState?.gameStatus
                });
                
                this.hideModal();
                
                if (this.socket && this.socket.connected) {
                    this.debug?.logSocketEmit('startGame', { source: 'modal-fixed', gameStatus: this.gameState?.gameStatus });
                    this.socket.emit('startGame');
                    this.showNotification('Neue Runde wird gestartet...', 'info');
                } else {
                    this.debug?.logUIEvent('No socket connection available');
                    this.showNotification('Keine Verbindung zum Server', 'error');
                }
            };
            
            // Remove all existing event listeners by cloning the button
            const newButton = this.elements.newGameBtn.cloneNode(true);
            this.elements.newGameBtn.parentNode.replaceChild(newButton, this.elements.newGameBtn);
            this.elements.newGameBtn = newButton;
            
            // Add event listeners to the new button
            this.elements.newGameBtn.addEventListener('click', handleButtonClick, { capture: true });
            this.elements.newGameBtn.addEventListener('mousedown', handleButtonClick, { capture: true });
            this.elements.newGameBtn.addEventListener('touchstart', handleButtonClick, { capture: true });
            
            // Also add event delegation to the modal itself as fallback
            this.elements.gameEndModal.addEventListener('click', (e) => {
                if (e.target === this.elements.newGameBtn || e.target.closest('#new-game-btn')) {
                    this.debug?.logUIEvent('Modal delegation click detected');
                    handleButtonClick(e);
                }
            }, { capture: true });
            
            // Ensure button is focusable and visible
            this.elements.newGameBtn.style.position = 'relative';
            this.elements.newGameBtn.style.zIndex = '99999';
            this.elements.newGameBtn.tabIndex = 0;
            this.elements.newGameBtn.focus();
            
            this.debug?.logUIEvent('Button setup complete - testing hover detection');
            
            // Test if events work at all
            this.elements.newGameBtn.addEventListener('mouseenter', () => {
                this.debug?.logUIEvent('Button mouse enter detected - events work!');
            });
            
            // Additional test: keyboard support
            this.elements.newGameBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    this.debug?.logUIEvent('Button keyboard activated');
                    handleButtonClick(e);
                }
            });
            
        }, 150);
    }

    hideModal() {
        this.debug?.logUIEvent('Hiding game end modal');
        this.elements.gameEndModal.style.display = 'none';
        this.enableGameInteractions();
        document.body.style.cursor = 'default';
    }
    
    disableGameInteractions() {
        // Disable drag and drop on hand cards
        const handCards = this.elements.playerHand.querySelectorAll('.card');
        handCards.forEach(card => {
            card.style.pointerEvents = 'none';
            card.draggable = false;
        });
        
        // Disable drop zones
        const dropZones = this.elements.dropZones.querySelectorAll('.drop-zone');
        dropZones.forEach(zone => {
            zone.style.pointerEvents = 'none';
        });
        
        // Clear any active drag state
        document.body.classList.remove('dragging');
    }
    
    enableGameInteractions() {
        // Re-enable drag and drop on hand cards
        const handCards = this.elements.playerHand.querySelectorAll('.card');
        handCards.forEach(card => {
            card.style.pointerEvents = 'auto';
            card.draggable = true;
        });
        
        // Re-enable drop zones
        const dropZones = this.elements.dropZones.querySelectorAll('.drop-zone');
        dropZones.forEach(zone => {
            zone.style.pointerEvents = 'auto';
        });
    }

    showGameMenu() {
        // Update menu status information
        this.updateMenuInfo();
        
        // Show the game menu modal
        this.elements.gameMenuModal.style.display = 'flex';
        
        // Focus the menu for accessibility
        setTimeout(() => {
            this.elements.restartGameBtn.focus();
        }, 100);
    }
    
    hideGameMenu() {
        this.elements.gameMenuModal.style.display = 'none';
    }
    
    updateMenuInfo() {
        // Update game status
        if (this.gameState) {
            const statusTexts = {
                'waiting': 'Warten auf Spieler',
                'running': 'Spiel läuft',
                'ended': 'Spiel beendet'
            };
            this.elements.menuGameStatus.textContent = statusTexts[this.gameState.gameStatus] || 'Unbekannt';
        } else {
            this.elements.menuGameStatus.textContent = 'Nicht verbunden';
        }
        
        // Update connection status
        if (this.socket && this.socket.connected) {
            this.elements.menuConnectionStatus.textContent = 'Verbunden';
            this.elements.menuConnectionStatus.style.color = 'var(--success)';
        } else {
            this.elements.menuConnectionStatus.textContent = 'Getrennt';
            this.elements.menuConnectionStatus.style.color = 'var(--error)';
        }
        
        // Show/hide end game button based on game status
        if (this.gameState && this.gameState.gameStatus === 'running') {
            this.elements.endGameBtn.style.display = 'block';
        } else {
            this.elements.endGameBtn.style.display = 'none';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        this.elements.notifications.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentNode) {
                        this.elements.notifications.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
    }
}

// Global function for HTML onclick handler
function handleNewGameClick() {
    window.gameDebug?.logUIEvent('DIRECT HTML ONCLICK TRIGGERED!');
    
    if (window.gameManager) {
        window.gameManager.hideModal();
        
        if (window.gameManager.socket && window.gameManager.socket.connected) {
            window.gameDebug?.logSocketEmit('startGame', { source: 'html-onclick' });
            window.gameManager.socket.emit('startGame');
            window.gameManager.showNotification('Neue Runde wird gestartet...', 'info');
        } else {
            window.gameDebug?.logUIEvent('No socket connection in HTML onclick');
            window.gameManager.showNotification('Keine Verbindung zum Server', 'error');
        }
    } else {
        window.gameDebug?.logUIEvent('No gameManager instance found!');
        alert('Spiel-Manager nicht gefunden!');
    }
}

// Initialize Game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameManager = new GameManager();
});
