/**
 * Crystal Dating App - Simple Backend Server
 * Using JSON database for easy demo (no SQLite compilation needed)
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const matchingEngine = require('../algorithms/matchingEngine');

// ============================================
// CONFIGURATION
// ============================================

const PORT = process.env.PORT || 3500;
const DB_SIZE = process.env.DB_SIZE || '100';
const DB_PATH = path.join(__dirname, '../database', `crystal_${DB_SIZE}.json`);

// ============================================
// LOAD DATABASE
// ============================================

console.log(`\n🔮 Loading database: crystal_${DB_SIZE}.json`);
const database = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
console.log(`✅ Loaded ${database.users.length} users\n`);

// In-memory storage
let users = database.users;
let likes = database.likes || [];
let matches = database.matches || [];
let swipeHistory = [];

// ============================================
// SERVER SETUP
// ============================================

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// ============================================
// HELPER FUNCTIONS
// ============================================

function getUserById(userId) {
  return users.find(u => u.user_id === parseInt(userId));
}

function getLikesWaiting(userId, connectionMode) {
  return likes.filter(l =>
    l.liked_id === parseInt(userId) &&
    l.connection_mode === connectionMode &&
    !l.is_match
  ).length;
}

function saveDatabase() {
  // Optionally save state back to file
  fs.writeFileSync(DB_PATH, JSON.stringify({ users, likes, matches, meta: database.meta }, null, 2));
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * GET /api/status
 */
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    version: '0.1.0-prealpha',
    database: {
      size: DB_SIZE,
      users: users.length,
      matches: matches.length,
      likes: likes.length
    },
    features: {
      datingSocialism: true,
      fringeDating: true,
      bullseyePreferences: true,
      connectionModes: ['dating', 'casual', 'professional', 'platonic']
    }
  });
});

/**
 * GET /api/users
 */
app.get('/api/users', (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  const start = parseInt(offset);
  const end = start + parseInt(limit);

  const userList = users.slice(start, end).map(u => ({
    user_id: u.user_id,
    username: u.username,
    display_name: u.display_name,
    age: u.age,
    gender: u.gender,
    location_city: u.location_city,
    bio: u.bio,
    avatar_seed: u.avatar_seed
  }));

  res.json({ users: userList, total: users.length, count: userList.length });
});

/**
 * GET /api/users/:userId
 */
app.get('/api/users/:userId', (req, res) => {
  const user = getUserById(req.params.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ profile: user });
});

/**
 * POST /api/users/create
 * Create a new user account
 */
app.post('/api/users/create', (req, res) => {
  try {
    const newUser = req.body;

    // Generate new user ID
    const maxId = Math.max(...users.map(u => u.user_id));
    const userId = maxId + 1;

    // Create complete user object with defaults
    const user = {
      user_id: userId,
      username: newUser.username || `user${userId}`,
      display_name: newUser.display_name,
      age: newUser.age,
      gender: newUser.gender,
      sexual_orientation: newUser.sexual_orientation || 'heterosexual',
      location_city: newUser.location_city,
      location_state: newUser.location_state || 'NY',
      bio: newUser.bio || '',
      avatar_seed: newUser.username || `user${userId}`,

      // Visibility metrics
      visibility_score: 1.0,
      likes_received_week: 0,
      likes_given_week: 0,
      swipes_week: 0,
      matches_total: 0,

      // Connection modes
      seeking_dating: newUser.seeking_dating !== undefined ? newUser.seeking_dating : 1,
      seeking_casual: newUser.seeking_casual || 0,
      seeking_professional: newUser.seeking_professional || 0,
      seeking_platonic: newUser.seeking_platonic || 0,

      // Details
      details: newUser.details || {},
      preferences: newUser.preferences || {}
    };

    // Add to users array
    users.push(user);

    res.json({
      success: true,
      user_id: userId,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('User creation error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * GET /api/users/:userId/stats
 */
app.get('/api/users/:userId/stats', (req, res) => {
  const user = getUserById(req.params.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const avgLPW = users.reduce((sum, u) => sum + u.likes_received_week, 0) / users.length;

  res.json({
    stats: {
      visibility_score: user.visibility_score,
      likes_received_week: user.likes_received_week,
      likes_given_week: user.likes_given_week,
      swipes_week: user.swipes_week,
      matches_total: user.matches_total,
      platform_average_lpw: avgLPW.toFixed(2)
    }
  });
});

/**
 * GET /api/feed/:userId
 */
app.get('/api/feed/:userId', (req, res) => {
  const {
    connectionMode = 'dating',
    limit = 20,
    offset = 0,
    includeOutsidePreferences = false
  } = req.query;

  const viewer = getUserById(req.params.userId);
  if (!viewer) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Generate feed
  const feed = matchingEngine.generateFeed(
    viewer,
    users,
    connectionMode,
    {
      limit: parseInt(limit),
      offset: parseInt(offset),
      includeOutsidePreferences: includeOutsidePreferences === 'true'
    }
  );

  res.json({
    feed,
    count: feed.length,
    connectionMode
  });
});

/**
 * POST /api/swipe
 */
app.post('/api/swipe', (req, res) => {
  const { swiperId, swipedId, direction, connectionMode = 'dating' } = req.body;

  if (!swiperId || !swipedId || !direction) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Record swipe
    swipeHistory.push({
      swiper_id: parseInt(swiperId),
      swiped_id: parseInt(swipedId),
      direction,
      connection_mode: connectionMode,
      timestamp: new Date().toISOString()
    });

    // Update swiper's swipe count
    const swiper = getUserById(swiperId);
    if (swiper) {
      swiper.swipes_week += 1;
    }

    let result = { success: true, isMatch: false };

    // If right swipe (like), record it and check for match
    if (direction === 'right') {
      // Add like
      likes.push({
        liker_id: parseInt(swiperId),
        liked_id: parseInt(swipedId),
        connection_mode: connectionMode,
        is_match: false,
        timestamp: new Date().toISOString()
      });

      // Check for mutual like
      const mutualLike = likes.find(l =>
        l.liker_id === parseInt(swipedId) &&
        l.liked_id === parseInt(swiperId) &&
        l.connection_mode === connectionMode
      );

      if (mutualLike) {
        // It's a match!
        result.isMatch = true;
        result.matchId = parseInt(swipedId);

        // Update likes to mark as matched
        likes.forEach(l => {
          if ((l.liker_id === parseInt(swiperId) && l.liked_id === parseInt(swipedId)) ||
              (l.liker_id === parseInt(swipedId) && l.liked_id === parseInt(swiperId))) {
            if (l.connection_mode === connectionMode) {
              l.is_match = true;
            }
          }
        });

        // Add to matches
        matches.push({
          user1_id: parseInt(swiperId),
          user2_id: parseInt(swipedId),
          connection_mode: connectionMode,
          matched_at: new Date().toISOString()
        });

        // Update match counts
        if (swiper) swiper.matches_total += 1;
        const swiped = getUserById(swipedId);
        if (swiped) swiped.matches_total += 1;
      }
    }

    // Calculate match probability
    const userSwipes = swipeHistory.filter(s => s.swiper_id === parseInt(swiperId)).length;
    const likesWaiting = getLikesWaiting(swiperId, connectionMode);
    const matchProbability = matchingEngine.calculateMatchProbability(userSwipes, likesWaiting);

    result.matchProbability = matchProbability;
    result.likesWaiting = likesWaiting;

    res.json(result);
  } catch (error) {
    console.error('Swipe error:', error);
    res.status(500).json({ error: 'Failed to record swipe' });
  }
});

/**
 * GET /api/matches/:userId
 */
app.get('/api/matches/:userId', (req, res) => {
  const { connectionMode = 'dating' } = req.query;
  const userId = parseInt(req.params.userId);

  const userMatches = matches.filter(m =>
    (m.user1_id === userId || m.user2_id === userId) &&
    m.connection_mode === connectionMode
  );

  const matchProfiles = userMatches.map(match => {
    const matchUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
    const profile = getUserById(matchUserId);
    return {
      ...match,
      profile
    };
  });

  res.json({
    matches: matchProfiles,
    count: matchProfiles.length
  });
});

/**
 * POST /api/visibility/update
 */
app.post('/api/visibility/update', (req, res) => {
  try {
    const updatedUsers = matchingEngine.updateAllVisibilityScores(users);

    users = updatedUsers;

    res.json({
      success: true,
      usersUpdated: users.length,
      platformAverageLPW: users[0]?.platform_average_lpw || 0
    });
  } catch (error) {
    console.error('Visibility update error:', error);
    res.status(500).json({ error: 'Failed to update visibility scores' });
  }
});

/**
 * GET /api/compatibility
 */
app.get('/api/compatibility', (req, res) => {
  const { user1Id, user2Id } = req.query;

  if (!user1Id || !user2Id) {
    return res.status(400).json({ error: 'Missing user IDs' });
  }

  const user1 = getUserById(user1Id);
  const user2 = getUserById(user2Id);

  if (!user1 || !user2) {
    return res.status(404).json({ error: 'User not found' });
  }

  const compatibility = matchingEngine.calculateOverallCompatibility(user1, user2);

  res.json({ compatibility });
});

// ============================================
// ROOT REDIRECT
// ============================================

// Redirect root to login page
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// ============================================
// START SERVER / EXPORT FOR VERCEL
// ============================================

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n🔮 Crystal Dating App - Backend Server`);
    console.log(`📍 Running on: http://localhost:${PORT}`);
    console.log(`📊 Database: ${DB_SIZE} users`);
    console.log(`✨ Features: Dating Socialism, Fringe Dating, Bullseye Matching`);
    console.log(`\n📡 Try: curl http://localhost:${PORT}/api/status\n`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down Crystal Dating backend...');
    // saveDatabase(); // Uncomment to persist state
    process.exit(0);
  });
}

// Export for Vercel serverless
module.exports = app;
