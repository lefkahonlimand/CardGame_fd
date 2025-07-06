/**
 * Test-Skript für die Debug-Funktionen
 * Kann im Browser ausgeführt werden
 */

// Test verschiedene Debug-Szenarien
function testDebugFunctions() {
    if (!window.gameDebug) {
        console.error('Debug utilities not loaded!');
        return;
    }

    const debug = window.gameDebug;

    // Test verschiedene Log-Level
    debug.log('debug', 'This is a debug message', { test: 'data' });
    debug.log('info', 'This is an info message', { test: 'data' });
    debug.log('warn', 'This is a warning message', { test: 'data' });
    debug.log('error', 'This is an error message', { test: 'data' });

    // Test spezielle Logging-Methoden
    debug.logGameEvent('Test game event', { gameId: '123' });
    debug.logSocketEvent('testEvent', { data: 'test' });
    debug.logUIEvent('Button clicked', { buttonId: 'test-btn' });
    debug.logValidation(false, 'Test validation failed', { field: 'email' });

    // Test Error Logging
    debug.logError(new Error('Test error'), { context: 'test' });

    // Test Performance Timer
    debug.startPerformanceTimer('testOperation');
    setTimeout(() => {
        debug.endPerformanceTimer('testOperation');
    }, 100);

    // Test Game State Logging
    const mockGameState = {
        gameStatus: 'running',
        currentPlayer: 'player1',
        players: { player1: { name: 'Alice' }, player2: { name: 'Bob' } },
        board: { '0,0': { name: 'Test Card' } },
        deckCount: 15
    };
    debug.logGameState(mockGameState, 'mock state test');

    console.log('Debug functions tested! Check the debug panel (Ctrl+Shift+D) to see the logs.');
}

// Exportiere für den Browser
if (typeof window !== 'undefined') {
    window.testDebugFunctions = testDebugFunctions;
}

// Test-Anweisungen
console.log(`
🐛 DEBUG TEST SCRIPT LOADED 🐛

To test the debug functions:
1. Open the browser console
2. Run: testDebugFunctions()
3. Press Ctrl+Shift+D to open the debug panel
4. Check all the different log categories and levels

Available debug methods:
- gameDebug.log(level, message, data, category)
- gameDebug.logGameEvent(message, data)
- gameDebug.logSocketEvent(event, data)
- gameDebug.logUIEvent(message, data)
- gameDebug.logValidation(isValid, message, data)
- gameDebug.logError(error, context)
- gameDebug.logGameState(gameState, context)
- gameDebug.startPerformanceTimer(name) / endPerformanceTimer(name)
- gameDebug.exportLogs() - Download logs as JSON
- gameDebug.clearLogs() - Clear all logs

Debug Panel Controls:
- Ctrl+Shift+D: Show/hide debug panel
- Filter by category (Game, Socket, UI, Validation, Errors)
- Export logs to JSON file
- Clear logs
`);
