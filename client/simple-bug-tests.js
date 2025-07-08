// Simple Bug Tests - nur Console Logging für konkrete Bugs
// 🐛 Bug 1: Scroll-Problem nach oben
// 🐛 Bug 2: "Position bereits belegt" Fehler bei Insertion-Zones

class SimpleBugTests {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.setupBugTests();
    }

    setupBugTests() {
        console.log('🔍 Simple Bug Tests aktiviert');
        
        // Bug 1: Scroll-Problem Test
        this.setupScrollBugTest();
        
        // Bug 2: Insertion-Zone Bug Test
        this.setupInsertionBugTest();
    }

    // 🐛 BUG 1: SCROLL-PROBLEM TEST (FIXED VERSION)
    setupScrollBugTest() {
        const gameBoard = document.getElementById('game-board');
        if (!gameBoard) {
            console.error('❌ BUG TEST: Game board nicht gefunden');
            return;
        }

        // Test scroll functionality - should now work
        gameBoard.addEventListener('wheel', (e) => {
            const scrollBefore = gameBoard.scrollTop;
            
            // Kurz warten und dann prüfen
            setTimeout(() => {
                const scrollAfter = gameBoard.scrollTop;
                const deltaY = e.deltaY;
                
                // FIXED: Check if scroll is working correctly
                if (deltaY < 0 && scrollBefore > 0) {
                    if (scrollAfter < scrollBefore) {
                        console.log('✅ SCROLL FIXED: Scroll nach oben funktioniert!');
                    } else if (scrollAfter === scrollBefore) {
                        console.warn('⚠️ SCROLL ISSUE: Scroll nach oben immer noch blockiert');
                        console.log('📊 Scroll Debug:', {
                            deltaY: deltaY,
                            scrollBefore: scrollBefore,
                            scrollAfter: scrollAfter,
                            scrollHeight: gameBoard.scrollHeight,
                            clientHeight: gameBoard.clientHeight,
                            maxScroll: gameBoard.scrollHeight - gameBoard.clientHeight,
                            overflowY: getComputedStyle(gameBoard).overflowY,
                            scrollBehavior: getComputedStyle(gameBoard).scrollBehavior
                        });
                    }
                }
                
                // Test scroll down
                if (deltaY > 0 && scrollBefore < (gameBoard.scrollHeight - gameBoard.clientHeight)) {
                    if (scrollAfter > scrollBefore) {
                        console.log('✅ SCROLL: Scroll nach unten funktioniert');
                    }
                }
            }, 50);
        });

        // Test für programmatisches Scrollen
        const originalScrollTo = gameBoard.scrollTo;
        gameBoard.scrollTo = function(options) {
            const beforeScroll = this.scrollTop;
            console.log('📜 Scroll-Versuch:', { 
                before: beforeScroll, 
                target: options.top || options,
                scrollHeight: this.scrollHeight,
                clientHeight: this.clientHeight
            });
            
            const result = originalScrollTo.call(this, options);
            
            setTimeout(() => {
                const afterScroll = this.scrollTop;
                if (beforeScroll !== afterScroll) {
                    console.log('✅ Scroll erfolgreich:', { before: beforeScroll, after: afterScroll });
                } else {
                    console.error('🐛 BUG: Scroll hatte keine Wirkung!');
                }
            }, 100);
            
            return result;
        };
    }

    // 🐛 BUG 2: INSERTION-ZONE "POSITION BELEGT" TEST
    setupInsertionBugTest() {
        // Überwache Insertion-Zone Klicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('floating-insertion-zone')) {
                const zone = e.target;
                const originalPosition = zone.dataset.originalPosition;
                const boardState = this.gameManager?.gameState?.board || {};
                
                console.log('🎯 Insertion-Zone Click:', {
                    originalPosition: originalPosition,
                    isPositionOccupied: !!boardState[originalPosition],
                    boardCard: boardState[originalPosition] || null,
                    floatingX: zone.dataset.floatingX,
                    floatingY: zone.dataset.floatingY,
                    draggedCard: this.gameManager?.draggedCard?.id || null
                });
                
                // BUG: Prüfe ob Position fälschlicherweise als belegt gilt
                if (boardState[originalPosition]) {
                    console.error('🐛 BUG DETECTED: Position bereits belegt Fehler!');
                    console.log('🔍 Bug Details:', {
                        originalPosition: originalPosition,
                        occupiedBy: boardState[originalPosition],
                        shouldBeAvailable: 'Zone sollte verfügbar sein für neue Karte',
                        floatingPosition: `${zone.dataset.floatingX},${zone.dataset.floatingY}`
                    });
                }
            }
        });

        // Überwache Board-Änderungen für Insertion-Probleme
        if (this.gameManager) {
            const originalHandleCardPlacement = this.gameManager.handleCardPlacement;
            if (originalHandleCardPlacement) {
                this.gameManager.handleCardPlacement = function(position, cardId) {
                    console.log('🃏 Card Placement Versuch:', {
                        position: position,
                        cardId: cardId,
                        currentBoardState: Object.keys(this.gameState.board || {}).length + ' Karten',
                        isPositionOccupied: !!(this.gameState.board || {})[position]
                    });
                    
                    const result = originalHandleCardPlacement.call(this, position, cardId);
                    
                    if (!result) {
                        console.error('🐛 BUG: Card Placement fehlgeschlagen!');
                        console.log('🔍 Failure Details:', {
                            position: position,
                            cardId: cardId,
                            boardState: this.gameState.board || {},
                            reason: 'Placement returned false'
                        });
                    }
                    
                    return result;
                };
            }
        }
    }

    // 🔍 Manual Bug Test Triggers (einfache Funktionen)
    testScrollBug() {
        console.log('🧪 Manual Scroll Bug Test');
        const gameBoard = document.getElementById('game-board');
        if (gameBoard) {
            console.log('📊 Current Scroll State:', {
                scrollTop: gameBoard.scrollTop,
                scrollHeight: gameBoard.scrollHeight,
                clientHeight: gameBoard.clientHeight,
                canScrollUp: gameBoard.scrollTop > 0,
                canScrollDown: gameBoard.scrollTop < (gameBoard.scrollHeight - gameBoard.clientHeight)
            });
            
            // Versuch nach oben zu scrollen
            if (gameBoard.scrollTop > 0) {
                gameBoard.scrollTo({ top: gameBoard.scrollTop - 100, behavior: 'smooth' });
            } else {
                console.log('⚠️ Bereits ganz oben, kann nicht weiter nach oben scrollen');
            }
        }
    }

    testInsertionBug() {
        console.log('🧪 Manual Insertion Bug Test');
        const zones = document.querySelectorAll('.floating-insertion-zone');
        console.log('🎯 Found Insertion Zones:', zones.length);
        
        zones.forEach((zone, index) => {
            console.log(`Zone ${index}:`, {
                originalPosition: zone.dataset.originalPosition,
                floatingPosition: `${zone.dataset.floatingX},${zone.dataset.floatingY}`,
                isVisible: zone.style.display !== 'none',
                isClickable: !zone.disabled
            });
        });
    }
}

// Auto-initialize wenn GameManager verfügbar ist
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.gameManager) {
            window.simpleBugTests = new SimpleBugTests(window.gameManager);
            console.log('🔍 Simple Bug Tests ready!');
            console.log('Manual test functions available:');
            console.log('- window.simpleBugTests.testScrollBug()');
            console.log('- window.simpleBugTests.testInsertionBug()');
        }
    }, 1000);
});
