/**
 * Crystal Dating App - Debug Logger
 *
 * Tracks user sessions, UI states, and interactions for easy debugging
 * Records timestamps, UI components, and code references
 */

class DebugLogger {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.sessionStart = new Date();
        this.logs = [];
        this.uiStates = [];
        this.interactions = [];
        this.errors = [];
        this.currentUI = null;
        this.enabled = true;

        // UI component to code file mapping
        this.codeMap = {
            'profile-card': { file: 'app.js', line: '140-170', component: 'showProfile()' },
            'swipe-buttons': { file: 'app.js', line: '171-195', component: 'handleSwipe()' },
            'stats-dashboard': { file: 'app.js', line: '75-90', component: 'loadUserStats()' },
            'mode-selector': { file: 'app.js', line: '25-30', component: 'mode button handler' },
            'user-selector': { file: 'app.js', line: '33-38', component: 'user selector handler' },
            'match-modal': { file: 'app.js', line: '197-210', component: 'showMatchModal()' },
            'feed-loading': { file: 'app.js', line: '92-110', component: 'loadFeed()' },
            'api-call': { file: 'app.js', line: 'various', component: 'API fetch calls' }
        };

        this.init();
    }

    init() {
        // Log session start
        this.log('SESSION_START', {
            sessionId: this.sessionId,
            timestamp: this.sessionStart.toISOString(),
            userAgent: navigator.userAgent,
            screenSize: `${window.innerWidth}x${window.innerHeight}`
        });

        // Set up error tracking
        window.addEventListener('error', (e) => this.captureError(e));
        window.addEventListener('unhandledrejection', (e) => this.captureError(e));

        // Track visibility changes
        document.addEventListener('visibilitychange', () => {
            this.log('VISIBILITY_CHANGE', { hidden: document.hidden });
        });

        console.log(`🔍 Debug Logger initialized - Session: ${this.sessionId}`);
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    log(type, data, uiComponent = null) {
        if (!this.enabled) return;

        const entry = {
            timestamp: new Date().toISOString(),
            relativeTime: Date.now() - this.sessionStart.getTime(),
            type,
            data,
            uiComponent,
            codeReference: uiComponent ? this.codeMap[uiComponent] : null,
            url: window.location.href
        };

        this.logs.push(entry);

        // Keep last 1000 entries to prevent memory issues
        if (this.logs.length > 1000) {
            this.logs.shift();
        }

        // Also log to console in dev mode
        if (this.enabled) {
            const codeRef = entry.codeReference ?
                `[${entry.codeReference.file}:${entry.codeReference.line}]` : '';
            console.log(`🔍 ${type} ${codeRef}`, data);
        }
    }

    trackUIState(componentName, state) {
        this.currentUI = componentName;

        const uiState = {
            timestamp: new Date().toISOString(),
            component: componentName,
            state,
            codeReference: this.codeMap[componentName]
        };

        this.uiStates.push(uiState);
        this.log('UI_STATE', uiState, componentName);

        // Keep last 100 UI states
        if (this.uiStates.length > 100) {
            this.uiStates.shift();
        }
    }

    trackInteraction(action, details) {
        const interaction = {
            timestamp: new Date().toISOString(),
            action,
            details,
            currentUI: this.currentUI,
            codeReference: this.codeMap[this.currentUI]
        };

        this.interactions.push(interaction);
        this.log('INTERACTION', interaction, this.currentUI);

        // Keep last 500 interactions
        if (this.interactions.length > 500) {
            this.interactions.shift();
        }
    }

    captureError(error) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            message: error.message || error.reason,
            stack: error.error?.stack || error.stack,
            currentUI: this.currentUI,
            lastInteractions: this.interactions.slice(-10), // Last 10 actions
            currentUIState: this.uiStates[this.uiStates.length - 1],
            codeReference: this.codeMap[this.currentUI]
        };

        this.errors.push(errorEntry);
        this.log('ERROR', errorEntry, this.currentUI);

        console.error('🚨 Error captured:', errorEntry);
    }

    // Get session summary
    getSummary() {
        const sessionDuration = Date.now() - this.sessionStart.getTime();

        return {
            sessionId: this.sessionId,
            startTime: this.sessionStart.toISOString(),
            duration: this.formatDuration(sessionDuration),
            totalLogs: this.logs.length,
            totalInteractions: this.interactions.length,
            totalErrors: this.errors.length,
            uiComponentsVisited: [...new Set(this.uiStates.map(s => s.component))],
            mostRecentUI: this.currentUI,
            lastInteractions: this.interactions.slice(-5)
        };
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    // Export logs as JSON
    exportLogs() {
        const exportData = {
            session: {
                id: this.sessionId,
                startTime: this.sessionStart.toISOString(),
                endTime: new Date().toISOString(),
                duration: Date.now() - this.sessionStart.getTime()
            },
            summary: this.getSummary(),
            logs: this.logs,
            uiStates: this.uiStates,
            interactions: this.interactions,
            errors: this.errors,
            codeMap: this.codeMap
        };

        return JSON.stringify(exportData, null, 2);
    }

    // Download logs as file
    downloadLogs() {
        const data = this.exportLogs();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crystal-debug-${this.sessionId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.log('EXPORT', { message: 'Debug logs downloaded' });
        console.log('📥 Debug logs downloaded');
    }

    // Display logs in console table
    showLogs(filter = null) {
        let logsToShow = this.logs;

        if (filter) {
            logsToShow = this.logs.filter(l => l.type === filter);
        }

        console.table(logsToShow.slice(-50)); // Last 50 entries
        console.log(`Total entries: ${logsToShow.length}`);
    }

    // Get debugging context for current state
    getDebugContext() {
        return {
            currentUI: this.currentUI,
            codeReference: this.codeMap[this.currentUI],
            lastInteractions: this.interactions.slice(-10),
            currentState: this.uiStates[this.uiStates.length - 1],
            recentLogs: this.logs.slice(-20)
        };
    }

    // Clear logs (useful for testing)
    clear() {
        this.logs = [];
        this.uiStates = [];
        this.interactions = [];
        this.errors = [];
        this.log('LOGS_CLEARED', { message: 'Debug logs cleared' });
    }

    // Toggle logging
    toggle() {
        this.enabled = !this.enabled;
        console.log(`🔍 Debug Logger ${this.enabled ? 'enabled' : 'disabled'}`);
    }
}

// Create global instance
window.debugLogger = new DebugLogger();

// Add keyboard shortcut for quick actions
document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+D = Download logs
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        window.debugLogger.downloadLogs();
    }

    // Ctrl+Shift+L = Show logs in console
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        window.debugLogger.showLogs();
    }

    // Ctrl+Shift+C = Show debug context
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        console.log('🔍 Current Debug Context:', window.debugLogger.getDebugContext());
    }

    // Ctrl+Shift+S = Show summary
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        console.log('📊 Session Summary:', window.debugLogger.getSummary());
    }
});

console.log(`
🔍 Debug Logger Commands:
- Ctrl+Shift+D = Download logs
- Ctrl+Shift+L = Show logs in console
- Ctrl+Shift+C = Show current debug context
- Ctrl+Shift+S = Show session summary

Or use:
- debugLogger.downloadLogs()
- debugLogger.showLogs()
- debugLogger.getSummary()
- debugLogger.getDebugContext()
`);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DebugLogger;
}
