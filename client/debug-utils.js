/**
 * Debug Utilities für Card Estimation Game
 * Implementiert Best Practices für Debugging und Logging
 */

class DebugUtils {
    constructor() {
        this.isDebugMode = this.getDebugMode();
        this.logs = [];
        this.maxLogs = 1000;
        this.logLevel = this.getLogLevel();
        this.startTime = Date.now();
        
        this.initializeDebugUI();
        this.setupGlobalErrorHandling();
        
        if (this.isDebugMode) {
            this.log('info', 'Debug-Modus aktiviert', { timestamp: new Date().toISOString() });
        }
    }

    getDebugMode() {
        // Debug-Modus über URL-Parameter, localStorage oder Umgebungsvariable aktivieren
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('debug') === 'true' || 
               localStorage.getItem('cardGameDebug') === 'true' ||
               window.location.hostname === 'localhost';
    }

    getLogLevel() {
        const urlParams = new URLSearchParams(window.location.search);
        const level = urlParams.get('logLevel') || localStorage.getItem('cardGameLogLevel') || 'info';
        return level;
    }

    /**
     * Hauptlogging-Funktion
     * @param {string} level - debug, info, warn, error
     * @param {string} message - Log-Nachricht
     * @param {object} data - Zusätzliche Daten
     * @param {string} category - Kategorie (game, socket, ui, validation)
     */
    log(level, message, data = {}, category = 'general') {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data,
            category,
            stackTrace: level === 'error' ? new Error().stack : null,
            sessionTime: Date.now() - this.startTime
        };

        // In-Memory speichern
        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Browser-Konsole ausgeben
        if (this.shouldLog(level)) {
            const consoleMethod = this.getConsoleMethod(level);
            const prefix = `[${timestamp}] [${category.toUpperCase()}] [${level.toUpperCase()}]`;
            
            if (Object.keys(data).length > 0) {
                console[consoleMethod](prefix, message, data);
            } else {
                console[consoleMethod](prefix, message);
            }
        }

        // Debug-UI aktualisieren
        if (this.isDebugMode) {
            this.updateDebugUI(logEntry);
        }

        // Lokaler Storage für persistente Logs (nur Fehler)
        if (level === 'error') {
            this.saveErrorToStorage(logEntry);
        }
    }

    shouldLog(level) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        const currentLevel = levels[this.logLevel] || 1;
        const messageLevel = levels[level] || 1;
        return messageLevel >= currentLevel;
    }

    getConsoleMethod(level) {
        const methods = {
            debug: 'debug',
            info: 'info', 
            warn: 'warn',
            error: 'error'
        };
        return methods[level] || 'log';
    }

    // Spezielle Logging-Methoden für verschiedene Kategorien
    logGameEvent(message, data = {}) {
        this.log('info', message, data, 'game');
    }

    logSocketEvent(event, data = {}) {
        this.log('info', `Socket Event: ${event}`, data, 'socket');
    }

    logUIEvent(message, data = {}) {
        this.log('debug', message, data, 'ui');
    }

    logValidation(isValid, message, data = {}) {
        const level = isValid ? 'info' : 'warn';
        this.log(level, `Validation: ${message}`, data, 'validation');
    }

    logError(error, context = {}) {
        const errorData = {
            message: error.message,
            stack: error.stack,
            context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        this.log('error', 'JavaScript Error', errorData, 'error');
    }

    // Debug-UI erstellen
    initializeDebugUI() {
        if (!this.isDebugMode) return;

        const debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.innerHTML = `
            <div class="debug-header">
                <h3>🐛 Debug Panel</h3>
                <div class="debug-controls">
                    <button id="toggle-debug-logs">Logs Toggle</button>
                    <button id="clear-debug-logs">Clear</button>
                    <button id="export-debug-logs">Export</button>
                    <button id="close-debug-panel">×</button>
                </div>
            </div>
            <div class="debug-filters">
                <label><input type="checkbox" checked data-filter="game"> Game</label>
                <label><input type="checkbox" checked data-filter="socket"> Socket</label>
                <label><input type="checkbox" checked data-filter="ui"> UI</label>
                <label><input type="checkbox" checked data-filter="validation"> Validation</label>
                <label><input type="checkbox" checked data-filter="error"> Errors</label>
            </div>
            <div class="debug-logs" id="debug-logs"></div>
        `;

        // Styling
        debugPanel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 400px;
            max-height: 500px;
            background: rgba(0,0,0,0.9);
            color: #00ff00;
            font-family: monospace;
            font-size: 12px;
            border: 1px solid #333;
            border-radius: 5px;
            z-index: 10000;
            overflow: hidden;
            display: none;
        `;

        const style = document.createElement('style');
        style.textContent = `
            #debug-panel .debug-header {
                padding: 10px;
                background: #333;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            #debug-panel h3 {
                margin: 0;
                color: #00ff00;
            }
            #debug-panel .debug-controls button {
                background: #555;
                color: white;
                border: none;
                padding: 5px 10px;
                margin-left: 5px;
                border-radius: 3px;
                cursor: pointer;
            }
            #debug-panel .debug-controls button:hover {
                background: #777;
            }
            #debug-panel .debug-filters {
                padding: 10px;
                background: #222;
                display: flex;
                flex-wrap: wrap;
            }
            #debug-panel .debug-filters label {
                margin-right: 15px;
                color: #ccc;
                cursor: pointer;
            }
            #debug-panel .debug-logs {
                max-height: 300px;
                overflow-y: auto;
                padding: 10px;
            }
            #debug-panel .log-entry {
                margin-bottom: 5px;
                padding: 5px;
                border-left: 3px solid #555;
                font-size: 11px;
            }
            #debug-panel .log-entry.error { border-left-color: #ff4444; color: #ffcccc; }
            #debug-panel .log-entry.warn { border-left-color: #ffaa00; color: #ffffcc; }
            #debug-panel .log-entry.info { border-left-color: #4444ff; color: #ccccff; }
            #debug-panel .log-entry.debug { border-left-color: #888; color: #ccc; }
        `;

        document.head.appendChild(style);
        document.body.appendChild(debugPanel);

        this.setupDebugEventListeners();

        // Tastenkombination zum Anzeigen/Verstecken (Ctrl+Shift+D)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggleDebugPanel();
            }
        });
    }

    setupDebugEventListeners() {
        document.getElementById('toggle-debug-logs')?.addEventListener('click', () => {
            this.toggleDebugPanel();
        });

        document.getElementById('clear-debug-logs')?.addEventListener('click', () => {
            this.clearLogs();
        });

        document.getElementById('export-debug-logs')?.addEventListener('click', () => {
            this.exportLogs();
        });

        document.getElementById('close-debug-panel')?.addEventListener('click', () => {
            this.hideDebugPanel();
        });

        // Filter-Event-Listener
        document.querySelectorAll('[data-filter]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateDebugFilters();
            });
        });
    }

    toggleDebugPanel() {
        const panel = document.getElementById('debug-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }

    hideDebugPanel() {
        const panel = document.getElementById('debug-panel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    updateDebugUI(logEntry) {
        const logsContainer = document.getElementById('debug-logs');
        if (!logsContainer) return;

        const logElement = document.createElement('div');
        logElement.className = `log-entry ${logEntry.level}`;
        logElement.dataset.category = logEntry.category;
        
        const timeStr = new Date(logEntry.timestamp).toLocaleTimeString();
        const dataStr = Object.keys(logEntry.data).length > 0 ? 
            JSON.stringify(logEntry.data, null, 2) : '';
        
        logElement.innerHTML = `
            <div><strong>[${timeStr}] ${logEntry.message}</strong></div>
            ${dataStr ? `<div style="color: #999; margin-top: 5px;"><pre>${dataStr}</pre></div>` : ''}
        `;

        logsContainer.appendChild(logElement);
        logsContainer.scrollTop = logsContainer.scrollHeight;

        // Alte Einträge entfernen (UI Performance)
        while (logsContainer.children.length > 100) {
            logsContainer.removeChild(logsContainer.firstChild);
        }

        this.updateDebugFilters();
    }

    updateDebugFilters() {
        const checkboxes = document.querySelectorAll('[data-filter]');
        const activeFilters = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.dataset.filter);

        document.querySelectorAll('.log-entry').forEach(entry => {
            const shouldShow = activeFilters.includes(entry.dataset.category);
            entry.style.display = shouldShow ? 'block' : 'none';
        });
    }

    clearLogs() {
        this.logs = [];
        const logsContainer = document.getElementById('debug-logs');
        if (logsContainer) {
            logsContainer.innerHTML = '';
        }
        localStorage.removeItem('cardGameErrorLogs');
        this.log('info', 'Debug logs cleared');
    }

    exportLogs() {
        const data = {
            exportTime: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            logs: this.logs
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `card-game-debug-logs-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.log('info', 'Debug logs exported');
    }

    saveErrorToStorage(logEntry) {
        try {
            const key = 'cardGameErrorLogs';
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            existing.push(logEntry);
            
            // Nur die letzten 50 Fehler behalten
            if (existing.length > 50) {
                existing.splice(0, existing.length - 50);
            }
            
            localStorage.setItem(key, JSON.stringify(existing));
        } catch (e) {
            console.error('Failed to save error to localStorage:', e);
        }
    }

    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            this.logError(event.error, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.logError(new Error(event.reason), {
                type: 'unhandledPromiseRejection',
                reason: event.reason
            });
        });
    }

    // Performance Monitoring
    startPerformanceTimer(name) {
        if (this.isDebugMode) {
            performance.mark(`${name}-start`);
        }
    }

    endPerformanceTimer(name) {
        if (this.isDebugMode) {
            performance.mark(`${name}-end`);
            performance.measure(name, `${name}-start`, `${name}-end`);
            const measure = performance.getEntriesByName(name)[0];
            this.log('debug', `Performance: ${name}`, { 
                duration: `${measure.duration.toFixed(2)}ms` 
            }, 'performance');
        }
    }

    // State Debugging
    logGameState(gameState, context = '') {
        this.log('debug', `Game State ${context}`, {
            gameStatus: gameState?.gameStatus,
            currentPlayer: gameState?.currentPlayer,
            playerCount: gameState?.players ? Object.keys(gameState.players).length : 0,
            handCount: gameState?.playerHand?.length || 0,
            boardCount: gameState?.board ? Object.keys(gameState.board).length : 0,
            deckCount: gameState?.deckCount
        }, 'game');
    }

    // Network Debugging
    logSocketEmit(event, data) {
        this.log('debug', `Socket EMIT: ${event}`, data, 'socket');
    }

    logSocketReceive(event, data) {
        this.log('debug', `Socket RECEIVE: ${event}`, data, 'socket');
    }
}

// Globale Debug-Instanz erstellen
window.gameDebug = new DebugUtils();

// Export für Module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DebugUtils;
}
