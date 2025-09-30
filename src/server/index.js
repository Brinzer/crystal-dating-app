/**
 * Crystal Dating App - Backend Server
 *
 * Express API server providing:
 * - User profile endpoints
 * - Matching and feed generation
 * - Swipe/like/match handling
 * - Statistics and visibility tracking
 *
 * Pure logic layer - UI-agnostic
 */

const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const matchingEngine = require('../algorithms/matchingEngine');

// ============================================
// CONFIGURATION
// ============================================

const PORT = process.env.PORT || 3500;
const DB_SIZE = process.env.DB_SIZE || '100'; // '100', '1000', or '10000'
const DB_PATH = path.join(__dirname, '../database', `crystal_${DB_SIZE}.db`);

// ============================================
// SERVER SETUP
// ============================================

const app = express();
const db = new Database(DB_PATH);

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// DATABASE HELPERS
// ============================================

/**
 * Get full user profile with details and preferences
 */
function getUserProfile(userId) {
  const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);
  if (!user) return null;

  const details = db.prepare('SELECT * FROM user_profile_details WHERE user_id = ?').get(userId);
  const preferences = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId);

  return { ...user, details, preferences };
}

/**
 * Get all users with basic info
 */
function getAllUsers() {
  return db.prepare(`
    SELECT u.*, d.*, p.*
    FROM users u
    LEFT JOIN user_profile_details d ON u.user_id = d.user_id
    LEFT JOIN user_preferences p ON u.user_id = p.user_id
    WHERE u.is_active = 1
  `).all();
}

/**
 * Get user's likes waiting (people who liked them but not matched yet)
 */
function getLikesWaiting(userId, connectionMode) {
  return db.prepare(`
    SELECT COUNT(*) as count
    FROM likes
    WHERE liked_id = ? AND connection_mode = ? AND is_match = 0
  `).get(userId, connectionMode).count;
}

/**
 * Record a swipe
 */
function recordSwipe(swiperId, swipedId, direction, connectionMode) {
  db.prepare(`
    INSERT INTO swipe_history (swiper_id, swiped_id, swipe_direction, connection_mode)
    VALUES (?, ?, ?, ?)
  `).run(swiperId, swipedId, direction, connectionMode);
}

/**
 * Record a like
 */
function recordLike(likerId, likedId, connectionMode) {
  // Insert like
  db.prepare(`
    INSERT OR IGNORE INTO likes (liker_id, liked_id, connection_mode)
    VALUES (?, ?, ?)
  `).run(likerId, likedId, connectionMode);

  // Check for mutual like (match)
  const mutualLike = db.prepare(`
    SELECT * FROM likes
    WHERE liker_id = ? AND liked_id = ? AND connection_mode = ?
  `).get(likedId, likerId, connectionMode);

  if (mutualLike) {
    // It's a match!
    createMatch(likerId, likedId, connectionMode);
    return { isMatch: true };
  }

  return { isMatch: false };
}

/**
 * Create a match
 */
function createMatch(user1Id, user2Id, connectionMode) {
  // Update likes table
  db.prepare(`
    UPDATE likes
    SET is_match = 1
    WHERE ((liker_id = ? AND liked_id = ?) OR (liker_id = ? AND liked_id = ?))
      AND connection_mode = ?
  `).run(user1Id, user2Id, user2Id, user1Id, connectionMode);

  // Insert into matches
  db.prepare(`
    INSERT OR IGNORE INTO matches (user1_id, user2_id, connection_mode)
    VALUES (?, ?, ?)
  `).run(user1Id, user2Id, connectionMode);

  // Update match counts
  db.prepare('UPDATE users SET matches_total = matches_total + 1 WHERE user_id IN (?, ?)').run(user1Id, user2Id);
}

/**
 * Get user's matches
 */
function getUserMatches(userId, connectionMode) {
  return db.prepare(`
    SELECT
      m.*,
      CASE
        WHEN m.user1_id = ? THEN m.user2_id
        ELSE m.user1_id
      END as match_user_id
    FROM matches m
    WHERE (m.user1_id = ? OR m.user2_id = ?)
      AND m.connection_mode = ?
      AND m.conversation_active = 1
  `).all(userId, userId, userId, connectionMode);
}

// ============================================
// API ENDPOINTS
// ============================================

/**
 * GET /api/status
 * Server health check
 */
app.get('/api/status', (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

  res.json({
    status: 'online',
    version: '0.1.0-prealpha',
    database: {
      size: DB_SIZE,
      users: userCount
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
 * Get all users (for admin/testing)
 */
app.get('/api/users', (req, res) => {
  const { limit = 50, offset = 0 } = req.query;

  const users = db.prepare(`
    SELECT user_id, username, display_name, age, gender, location_city, bio, avatar_seed
    FROM users
    WHERE is_active = 1
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  res.json({ users, count: users.length });
});

/**
 * GET /api/users/:userId
 * Get specific user profile
 */
app.get('/api/users/:userId', (req, res) => {
  const profile = getUserProfile(req.params.userId);

  if (!profile) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ profile });
});

/**
 * GET /api/users/:userId/stats
 * Get user's statistics and visibility
 */
app.get('/api/users/:userId/stats', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(req.params.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Calculate platform average
  const avgLPW = db.prepare('SELECT AVG(likes_received_week) as avg FROM users').get().avg || 0;

  // Get recent visibility log
  const visibilityHistory = db.prepare(`
    SELECT * FROM visibility_log
    WHERE user_id = ?
    ORDER BY recorded_at DESC
    LIMIT 10
  `).all(req.params.userId);

  res.json({
    stats: {
      visibility_score: user.visibility_score,
      likes_received_week: user.likes_received_week,
      likes_given_week: user.likes_given_week,
      swipes_week: user.swipes_week,
      matches_total: user.matches_total,
      platform_average_lpw: avgLPW
    },
    history: visibilityHistory
  });
});

/**
 * GET /api/feed/:userId
 * Generate personalized feed for user
 */
app.get('/api/feed/:userId', (req, res) => {
  const {
    connectionMode = 'dating',
    limit = 20,
    offset = 0,
    includeOutsidePreferences = false
  } = req.query;

  const viewer = getUserProfile(req.params.userId);
  if (!viewer) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Get all potential matches
  const allUsers = getAllUsers();

  // Generate feed using matching engine
  const feed = matchingEngine.generateFeed(
    viewer,
    allUsers,
    connectionMode,
    { limit: parseInt(limit), offset: parseInt(offset), includeOutsidePreferences: includeOutsidePreferences === 'true' }
  );

  res.json({
    feed,
    count: feed.length,
    connectionMode
  });
});

/**
 * POST /api/swipe
 * Record a swipe (like or pass)
 */
app.post('/api/swipe', (req, res) => {
  const { swiperId, swipedId, direction, connectionMode = 'dating' } = req.body;

  if (!swiperId || !swipedId || !direction) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Record swipe
    recordSwipe(swiperId, swipedId, direction, connectionMode);

    // Update swipe count
    db.prepare('UPDATE users SET swipes_week = swipes_week + 1 WHERE user_id = ?').run(swiperId);

    let result = { success: true, isMatch: false };

    // If right swipe (like), record it and check for match
    if (direction === 'right') {
      const likeResult = recordLike(swiperId, swipedId, connectionMode);

      if (likeResult.isMatch) {
        result.isMatch = true;
        result.matchId = swipedId;
      }
    }

    // Calculate updated match probability
    const swipesThisSession = db.prepare('SELECT COUNT(*) as count FROM swipe_history WHERE swiper_id = ?').get(swiperId).count;
    const likesWaiting = getLikesWaiting(swiperId, connectionMode);
    const matchProbability = matchingEngine.calculateMatchProbability(swipesThisSession, likesWaiting);

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
 * Get user's matches
 */
app.get('/api/matches/:userId', (req, res) => {
  const { connectionMode = 'dating' } = req.query;

  const matches = getUserMatches(req.params.userId, connectionMode);

  // Get full profiles for each match
  const matchProfiles = matches.map(match => {
    const profile = getUserProfile(match.match_user_id);
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
 * Recalculate visibility scores for all users (admin function)
 */
app.post('/api/visibility/update', (req, res) => {
  try {
    const allUsers = db.prepare('SELECT user_id, likes_received_week FROM users').all();

    const updatedUsers = matchingEngine.updateAllVisibilityScores(allUsers);

    // Update database
    const updateStmt = db.prepare('UPDATE users SET visibility_score = ? WHERE user_id = ?');
    const logStmt = db.prepare(`
      INSERT INTO visibility_log (user_id, visibility_score, likes_received_week, average_likes_week)
      VALUES (?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      for (const user of updatedUsers) {
        updateStmt.run(user.visibility_score, user.user_id);
        logStmt.run(user.user_id, user.visibility_score, user.likes_received_week, user.platform_average_lpw);
      }
    });

    transaction();

    res.json({
      success: true,
      usersUpdated: updatedUsers.length,
      platformAverageLPW: updatedUsers[0]?.platform_average_lpw || 0
    });
  } catch (error) {
    console.error('Visibility update error:', error);
    res.status(500).json({ error: 'Failed to update visibility scores' });
  }
});

/**
 * GET /api/compatibility
 * Calculate compatibility between two users
 */
app.get('/api/compatibility', (req, res) => {
  const { user1Id, user2Id } = req.query;

  if (!user1Id || !user2Id) {
    return res.status(400).json({ error: 'Missing user IDs' });
  }

  const user1 = getUserProfile(user1Id);
  const user2 = getUserProfile(user2Id);

  if (!user1 || !user2) {
    return res.status(404).json({ error: 'User not found' });
  }

  const compatibility = matchingEngine.calculateOverallCompatibility(user1, user2);

  res.json({ compatibility });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`\n🔮 Crystal Dating App - Backend Server`);
  console.log(`📍 Running on: http://localhost:${PORT}`);
  console.log(`📊 Database: ${DB_SIZE} users (${DB_PATH})`);
  console.log(`✨ Features: Dating Socialism, Fringe Dating, Bullseye Matching\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down Crystal Dating backend...');
  db.close();
  process.exit(0);
});
