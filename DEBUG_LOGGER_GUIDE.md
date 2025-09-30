# Crystal Dating App - Debug Logger Guide

## 🔍 Overview

The Crystal Dating App includes a comprehensive built-in debugging system that automatically tracks:
- Session timing and duration
- UI state changes
- User interactions
- API calls and responses
- Errors with full context
- Code references for each component

## 🚀 Quick Start

The debug logger is **automatically enabled** when you open the app. No setup required!

## ⌨️ Keyboard Shortcuts

- **Ctrl+Shift+D** - Download debug logs as JSON file
- **Ctrl+Shift+L** - Show logs in browser console
- **Ctrl+Shift+C** - Show current debug context
- **Ctrl+Shift+S** - Show session summary

## 📊 What Gets Logged

### Session Information
- Unique session ID
- Start time and duration
- User agent and screen size
- Page visibility changes

### UI State Tracking
Every time the UI changes, the logger records:
- **profile-card**: Current profile being viewed
  - User ID, name, age, compatibility score
  - Feed index position
- **stats-dashboard**: User statistics display
  - Visibility score, match probability, likes waiting
- **match-modal**: Match celebration display
  - Matched user details, modal visibility
- **user-selector**: User dropdown state
  - Number of users loaded
- **feed-loading**: Feed generation status
  - Feed size, connection mode

### User Interactions
All user actions are tracked:
- `MODE_CHANGE` - Switching connection modes (Dating/Casual/etc.)
- `USER_CHANGE` - Selecting different user perspective
- `SWIPE_PASS` - Clicking pass button
- `SWIPE_LIKE` - Clicking like button
- `KEYBOARD_SWIPE` - Using arrow keys to swipe
- `REFRESH_FEED` - Clicking refresh button
- `CLOSE_MATCH_MODAL` - Closing match celebration

### API Calls
Every API interaction is logged with:
- Endpoint URL and HTTP method
- Request parameters
- Response status and data
- Error details if failed

### Errors
All JavaScript errors are captured with:
- Error message and stack trace
- Current UI state at time of error
- Last 10 user interactions before error
- Code reference if available

## 🔗 Code Mapping

Each logged event includes a **code reference** showing exactly where in the codebase that UI component is handled:

| UI Component | File | Lines | Function |
|-------------|------|-------|----------|
| profile-card | app.js | 140-170 | showProfile() |
| swipe-buttons | app.js | 171-195 | handleSwipe() |
| stats-dashboard | app.js | 75-90 | loadUserStats() |
| mode-selector | app.js | 25-30 | mode button handler |
| user-selector | app.js | 33-38 | user selector handler |
| match-modal | app.js | 197-210 | showMatchModal() |
| feed-loading | app.js | 92-110 | loadFeed() |
| api-call | app.js | various | API fetch calls |

## 📥 Exporting Logs

### Method 1: Keyboard Shortcut
Press **Ctrl+Shift+D** to instantly download logs as JSON.

### Method 2: Console Command
Open browser console (F12) and type:
```javascript
debugLogger.downloadLogs()
```

### Method 3: Manual Export
```javascript
const logs = debugLogger.exportLogs()
console.log(logs)
```

## 🔍 Viewing Logs

### In Browser Console

**Show all recent logs:**
```javascript
debugLogger.showLogs()
```

**Show only specific log type:**
```javascript
debugLogger.showLogs('API_CALL')
debugLogger.showLogs('INTERACTION')
debugLogger.showLogs('ERROR')
```

**Get current debug context:**
```javascript
debugLogger.getDebugContext()
```

**Get session summary:**
```javascript
debugLogger.getSummary()
```

## 🎯 Debugging Workflows

### Issue: "Something went wrong when I clicked Like"

1. Press **Ctrl+Shift+C** to see current debug context
2. Look at `lastInteractions` - see what actions led up to the issue
3. Check `currentState` - see what UI was visible
4. Look at `codeReference` - find exact code location
5. Review `recentLogs` - see API calls and responses

### Issue: "The app stopped working after 10 minutes"

1. Press **Ctrl+Shift+D** to download full session logs
2. Open JSON file in text editor
3. Search for `"type": "ERROR"` to find errors
4. Check timestamps to see when issues started
5. Review `lastInteractions` in error entries to see what triggered it

### Issue: "Match probability not updating"

1. Press **Ctrl+Shift+L** to show logs in console
2. Filter for relevant events:
   ```javascript
   debugLogger.showLogs('SWIPE_RESULT')
   ```
3. Check if `matchProbability` values are changing
4. Look at API responses to verify backend is sending updates
5. Check stats-dashboard UI state to see if values are being displayed

## 📋 Log Entry Format

Each log entry contains:
```javascript
{
  timestamp: "2025-09-30T22:35:00.000Z",  // ISO timestamp
  relativeTime: 125000,                    // Milliseconds since session start
  type: "INTERACTION",                     // Log type
  data: {                                  // Event-specific data
    action: "SWIPE_LIKE",
    direction: "right"
  },
  uiComponent: "swipe-buttons",           // Which UI component
  codeReference: {                        // Exact code location
    file: "app.js",
    line: "171-195",
    component: "handleSwipe()"
  },
  url: "http://localhost:..."            // Current page URL
}
```

## 🧹 Managing Logs

**Clear all logs:**
```javascript
debugLogger.clear()
```

**Disable logging temporarily:**
```javascript
debugLogger.toggle()  // Disables
debugLogger.toggle()  // Re-enables
```

**Check if logging is enabled:**
```javascript
console.log(debugLogger.enabled)
```

## 🎨 Advanced Usage

### Track Custom Events
```javascript
debugLogger.log('CUSTOM_EVENT', {
  myData: 'value',
  timestamp: Date.now()
}, 'my-component')
```

### Track Custom UI State
```javascript
debugLogger.trackUIState('my-component', {
  state: 'active',
  data: { foo: 'bar' }
})
```

### Track Custom Interactions
```javascript
debugLogger.trackInteraction('MY_ACTION', {
  detail: 'something happened',
  value: 123
})
```

## 💾 Log Storage Limits

To prevent memory issues, the logger automatically limits:
- **Logs**: Last 1,000 entries
- **UI States**: Last 100 states
- **Interactions**: Last 500 interactions
- **Errors**: No limit (critical for debugging)

Older entries are automatically removed when limits are reached.

## 🚨 Error Tracking

When an error occurs, the logger automatically captures:
- Full error message and stack trace
- Current UI component being used
- Last 10 user interactions
- Current UI state
- Code reference for the active component

This makes it easy to reproduce and fix issues!

## 📁 Exported Log Structure

The downloaded JSON file includes:
```javascript
{
  session: {
    id: "session_1727728500000_xyz123",
    startTime: "2025-09-30T22:35:00.000Z",
    endTime: "2025-09-30T23:15:30.000Z",
    duration: 2430000  // milliseconds
  },
  summary: {
    totalLogs: 245,
    totalInteractions: 67,
    totalErrors: 0,
    uiComponentsVisited: ["profile-card", "stats-dashboard", ...],
    mostRecentUI: "match-modal",
    lastInteractions: [...]
  },
  logs: [...],          // All log entries
  uiStates: [...],      // All UI state changes
  interactions: [...],  // All user interactions
  errors: [...],        // All captured errors
  codeMap: {...}       // UI to code mapping
}
```

## 🎓 Best Practices

1. **Download logs after each test session** - Helps track changes over time
2. **Check logs before reporting bugs** - May reveal the exact issue
3. **Use keyboard shortcuts** - Faster than console commands
4. **Review session summary regularly** - Quick health check
5. **Keep logs organized** - Files are named `crystal-debug-{sessionId}.json`

## 🔮 Tips

- Logs persist across page navigations within the same session
- Session ID is shown in console on app startup
- All logs are also printed to browser console in real-time
- Console logs include code references: `🔍 TYPE [file:line] data`
- Use browser DevTools' filter to search console logs

---

**Built-in debugging for transparent, traceable development.**

💎 Crystal Dating - Making issues crystal clear.
