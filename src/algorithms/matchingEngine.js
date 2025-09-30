/**
 * Crystal Dating App - Core Matching Engine
 *
 * Implements:
 * 1. "Dating Socialism" - Inverse popularity visibility algorithm
 * 2. "Fringe Dating" - Boost for users outside mainstream preferences
 * 3. Bullseye/Ranked Preference Matching
 * 4. Compatibility Scoring
 *
 * Pure logic layer - no UI dependencies
 */

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================

const CONFIG = {
  // Dating Socialism parameters
  VISIBILITY_BASE: 1.0,
  FRINGE_MULTIPLIER: 1.5,
  MIN_VISIBILITY: 0.1, // Don't make anyone invisible
  MAX_VISIBILITY: 3.0, // Don't over-boost

  // Bullseye preference tiers
  PREFERENCE_WEIGHTS: {
    MUST_HAVE: 100,
    PREFERRED: 50,
    ACCEPTABLE: 25,
    OUTSIDE: -10
  },

  // Compatibility scoring thresholds
  MATCH_THRESHOLD: 60, // Minimum score to show as potential match
  GREAT_MATCH_THRESHOLD: 80,
  PERFECT_MATCH_THRESHOLD: 95
};

// ============================================
// DATING SOCIALISM ALGORITHM
// ============================================

/**
 * Calculate user visibility based on inverse popularity
 *
 * Core principle: Users with more likes become less visible
 * to equalize match opportunities across all users.
 *
 * @param {number} userLikesPerWeek - User's likes received this week
 * @param {number} averageLikesPerWeek - Platform average LPW
 * @returns {number} Visibility multiplier (0.1 to 3.0)
 */
function calculateVisibility(userLikesPerWeek, averageLikesPerWeek) {
  if (averageLikesPerWeek === 0 || userLikesPerWeek === 0) {
    return CONFIG.VISIBILITY_BASE;
  }

  // Inverse formula: visibility decreases as likes increase
  const rawVisibility = CONFIG.VISIBILITY_BASE * (averageLikesPerWeek / userLikesPerWeek);

  // Clamp to reasonable bounds
  return Math.max(
    CONFIG.MIN_VISIBILITY,
    Math.min(CONFIG.MAX_VISIBILITY, rawVisibility)
  );
}

/**
 * Update visibility scores for all users in database
 *
 * Should be run periodically (e.g., weekly) to recalculate
 * based on latest engagement metrics.
 *
 * @param {Array} users - All users with their likes_received_week
 * @returns {Array} Users with updated visibility_score
 */
function updateAllVisibilityScores(users) {
  // Calculate platform average LPW
  const totalLikes = users.reduce((sum, u) => sum + u.likes_received_week, 0);
  const averageLPW = users.length > 0 ? totalLikes / users.length : 0;

  // Update each user's visibility
  return users.map(user => ({
    ...user,
    visibility_score: calculateVisibility(user.likes_received_week, averageLPW),
    platform_average_lpw: averageLPW
  }));
}

// ============================================
// FRINGE DATING BOOST
// ============================================

/**
 * Calculate "Fringe Dating" boost score
 *
 * Increases visibility for users who are:
 * - Outside mainstream preferences (low overall popularity)
 * - BUT within this specific viewer's preferences
 *
 * This helps unique/niche users find their compatible matches.
 *
 * @param {Object} user - The user being evaluated
 * @param {Object} viewer - The person viewing profiles
 * @param {number} medianPopularity - Platform median popularity score
 * @returns {number} Fringe boost multiplier (1.0 = no boost)
 */
function calculateFringeBoost(user, viewer, medianPopularity) {
  // Only boost users below median popularity
  if (user.likes_received_week >= medianPopularity) {
    return 1.0;
  }

  // Check if user matches viewer's preferences
  const matchesPreferences = evaluatePreferenceMatch(user, viewer.preferences);

  if (matchesPreferences.tier === 'MUST_HAVE' || matchesPreferences.tier === 'PREFERRED') {
    // User is in viewer's preferences but unpopular overall
    // Calculate boost based on how far below median
    const popularityRatio = user.likes_received_week / (medianPopularity || 1);
    const boost = 1.0 + (1.0 - popularityRatio) * CONFIG.FRINGE_MULTIPLIER;

    return Math.min(boost, CONFIG.MAX_VISIBILITY);
  }

  return 1.0;
}

// ============================================
// BULLSEYE PREFERENCE MATCHING
// ============================================

/**
 * Evaluate how well a user matches viewer's preferences
 *
 * Uses bullseye/tiered preference system:
 * - Must-Have (inner circle): Deal breakers
 * - Preferred (middle ring): Strong preferences
 * - Acceptable (outer ring): Flexible preferences
 * - Outside (beyond target): Show with indicator
 *
 * @param {Object} user - User being evaluated
 * @param {Object} preferences - Viewer's preferences
 * @returns {Object} { tier, score, mismatches }
 */
function evaluatePreferenceMatch(user, preferences) {
  let score = 0;
  const mismatches = [];

  // AGE - Bullseye tiers
  const ageTier = evaluateAgeTier(user.age, preferences);
  if (ageTier.tier === 'MUST_HAVE') {
    score += CONFIG.PREFERENCE_WEIGHTS.MUST_HAVE;
  } else if (ageTier.tier === 'PREFERRED') {
    score += CONFIG.PREFERENCE_WEIGHTS.PREFERRED;
  } else if (ageTier.tier === 'ACCEPTABLE') {
    score += CONFIG.PREFERENCE_WEIGHTS.ACCEPTABLE;
  } else {
    score += CONFIG.PREFERENCE_WEIGHTS.OUTSIDE;
    mismatches.push({ field: 'age', severity: 'outside' });
  }

  // GENDER & ORIENTATION
  const seekingGenders = JSON.parse(preferences.seeking_genders || '[]');
  if (seekingGenders.includes(user.gender)) {
    score += CONFIG.PREFERENCE_WEIGHTS.MUST_HAVE;
  } else {
    score += CONFIG.PREFERENCE_WEIGHTS.OUTSIDE * 2; // More severe
    mismatches.push({ field: 'gender', severity: 'dealbreaker' });
  }

  // HEIGHT
  if (user.details && preferences.height_min_cm && preferences.height_max_cm) {
    if (user.details.height_cm >= preferences.height_min_cm &&
        user.details.height_cm <= preferences.height_max_cm) {
      score += CONFIG.PREFERENCE_WEIGHTS.PREFERRED;
    } else {
      score += CONFIG.PREFERENCE_WEIGHTS.OUTSIDE / 2; // Minor penalty
      mismatches.push({ field: 'height', severity: 'minor' });
    }
  }

  // LIFESTYLE - Smoking, Drinking, Drugs
  score += evaluateLifestyleCompatibility(user.details, preferences, mismatches);

  // CHILDREN
  score += evaluateChildrenCompatibility(user.details, preferences, mismatches);

  // EDUCATION
  score += evaluateEducationCompatibility(user.details, preferences, mismatches);

  // RELIGION & POLITICS
  score += evaluateBeliefCompatibility(user.details, preferences, mismatches);

  // Determine overall tier
  let tier;
  if (score >= CONFIG.PREFERENCE_WEIGHTS.MUST_HAVE * 2) {
    tier = 'MUST_HAVE';
  } else if (score >= CONFIG.PREFERENCE_WEIGHTS.PREFERRED) {
    tier = 'PREFERRED';
  } else if (score >= CONFIG.PREFERENCE_WEIGHTS.ACCEPTABLE) {
    tier = 'ACCEPTABLE';
  } else {
    tier = 'OUTSIDE';
  }

  return { tier, score, mismatches };
}

function evaluateAgeTier(age, preferences) {
  if (age >= preferences.age_min_musthave && age <= preferences.age_max_musthave) {
    return { tier: 'MUST_HAVE' };
  } else if (age >= preferences.age_min_preferred && age <= preferences.age_max_preferred) {
    return { tier: 'PREFERRED' };
  } else if (age >= preferences.age_min_acceptable && age <= preferences.age_max_acceptable) {
    return { tier: 'ACCEPTABLE' };
  }
  return { tier: 'OUTSIDE' };
}

function evaluateLifestyleCompatibility(details, preferences, mismatches) {
  let score = 0;

  // Smoking
  if (preferences.smoking_tolerance === 'dealbreaker' && details.smoking_status !== 'never') {
    score += CONFIG.PREFERENCE_WEIGHTS.OUTSIDE;
    mismatches.push({ field: 'smoking', severity: 'dealbreaker' });
  } else if (preferences.smoking_tolerance === 'ok' || details.smoking_status === 'never') {
    score += CONFIG.PREFERENCE_WEIGHTS.ACCEPTABLE;
  }

  // Drinking
  if (preferences.drinking_tolerance === 'dealbreaker' && details.drinking_frequency === 'regularly') {
    score += CONFIG.PREFERENCE_WEIGHTS.OUTSIDE;
    mismatches.push({ field: 'drinking', severity: 'dealbreaker' });
  } else if (preferences.drinking_tolerance === 'ok') {
    score += CONFIG.PREFERENCE_WEIGHTS.ACCEPTABLE;
  }

  // Drugs
  if (preferences.drugs_tolerance === 'dealbreaker' && details.drug_use !== 'never') {
    score += CONFIG.PREFERENCE_WEIGHTS.OUTSIDE;
    mismatches.push({ field: 'drugs', severity: 'dealbreaker' });
  } else if (preferences.drugs_tolerance === 'ok') {
    score += CONFIG.PREFERENCE_WEIGHTS.ACCEPTABLE;
  }

  return score;
}

function evaluateChildrenCompatibility(details, preferences, mismatches) {
  const hasChildren = details.has_children_number > 0;

  if (preferences.children_preference === 'dealbreaker_no' && hasChildren) {
    mismatches.push({ field: 'children', severity: 'dealbreaker' });
    return CONFIG.PREFERENCE_WEIGHTS.OUTSIDE;
  } else if (preferences.children_preference === 'must_have' && !hasChildren) {
    mismatches.push({ field: 'children', severity: 'dealbreaker' });
    return CONFIG.PREFERENCE_WEIGHTS.OUTSIDE;
  } else if (preferences.children_preference === 'neutral') {
    return CONFIG.PREFERENCE_WEIGHTS.ACCEPTABLE;
  }

  return CONFIG.PREFERENCE_WEIGHTS.PREFERRED;
}

function evaluateEducationCompatibility(details, preferences, mismatches) {
  const educationLevels = ['high school', 'some college', 'associate degree', 'bachelor degree', 'master degree', 'doctorate', 'trade school'];
  const userLevel = educationLevels.indexOf(details.education_level);
  const minLevel = educationLevels.indexOf(preferences.education_level_min);

  if (userLevel >= minLevel || preferences.career_importance === 'not_important') {
    return CONFIG.PREFERENCE_WEIGHTS.ACCEPTABLE;
  }

  mismatches.push({ field: 'education', severity: 'minor' });
  return CONFIG.PREFERENCE_WEIGHTS.OUTSIDE / 2;
}

function evaluateBeliefCompatibility(details, preferences, mismatches) {
  let score = 0;

  // Religion
  if (preferences.religion_compatibility_required) {
    if (details.religion === preferences.religion_importance) {
      score += CONFIG.PREFERENCE_WEIGHTS.PREFERRED;
    } else {
      mismatches.push({ field: 'religion', severity: 'important' });
      score += CONFIG.PREFERENCE_WEIGHTS.OUTSIDE;
    }
  } else {
    score += CONFIG.PREFERENCE_WEIGHTS.ACCEPTABLE / 2;
  }

  // Politics
  if (preferences.political_compatibility_required) {
    if (details.political_views === preferences.political_importance) {
      score += CONFIG.PREFERENCE_WEIGHTS.PREFERRED;
    } else {
      mismatches.push({ field: 'politics', severity: 'important' });
      score += CONFIG.PREFERENCE_WEIGHTS.OUTSIDE;
    }
  } else {
    score += CONFIG.PREFERENCE_WEIGHTS.ACCEPTABLE / 2;
  }

  return score;
}

// ============================================
// PERSONALITY COMPATIBILITY
// ============================================

/**
 * Calculate personality compatibility using Big Five traits
 *
 * Research suggests certain trait combinations are more compatible:
 * - High agreeableness in both partners
 * - Similar openness and conscientiousness
 * - Complementary extraversion (not too similar)
 *
 * @param {Object} user1Details - User 1's profile details
 * @param {Object} user2Details - User 2's profile details
 * @returns {number} Compatibility score 0-100
 */
function calculatePersonalityCompatibility(user1Details, user2Details) {
  let score = 0;

  // Agreeableness - higher is better for both
  const avgAgreeableness = (user1Details.agreeableness_score + user2Details.agreeableness_score) / 2;
  score += avgAgreeableness * 5;

  // Openness & Conscientiousness - similarity is good
  const opennessDiff = Math.abs(user1Details.openness_score - user2Details.openness_score);
  const conscientiousnessDiff = Math.abs(user1Details.conscientiousness_score - user2Details.conscientiousness_score);
  score += (10 - opennessDiff) * 2;
  score += (10 - conscientiousnessDiff) * 2;

  // Extraversion - slight differences can be complementary
  const extraversionDiff = Math.abs(user1Details.extraversion_score - user2Details.extraversion_score);
  const extraversionScore = extraversionDiff > 3 && extraversionDiff < 7 ? 15 : 10;
  score += extraversionScore;

  // Neuroticism - lower combined is generally better
  const avgNeuroticism = (user1Details.neuroticism_score + user2Details.neuroticism_score) / 2;
  score += (10 - avgNeuroticism) * 3;

  return Math.max(0, Math.min(100, score));
}

// ============================================
// INTEREST & HOBBY OVERLAP
// ============================================

/**
 * Calculate shared interests score
 *
 * @param {Array} interests1 - User 1's interests
 * @param {Array} interests2 - User 2's interests
 * @returns {number} Score 0-100
 */
function calculateInterestOverlap(interests1, interests2) {
  const set1 = new Set(interests1);
  const set2 = new Set(interests2);

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  // Jaccard similarity * 100
  return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
}

// ============================================
// OVERALL COMPATIBILITY SCORE
// ============================================

/**
 * Calculate overall compatibility between two users
 *
 * Combines:
 * - Preference matching (40%)
 * - Personality compatibility (30%)
 * - Interest overlap (20%)
 * - Communication style (10%)
 *
 * @param {Object} user1 - First user (with details and preferences)
 * @param {Object} user2 - Second user (with details and preferences)
 * @returns {Object} { score, breakdown, isMatch }
 */
function calculateOverallCompatibility(user1, user2) {
  // Preference matching (bidirectional)
  const user1ToUser2Prefs = evaluatePreferenceMatch(user2, user1.preferences);
  const user2ToUser1Prefs = evaluatePreferenceMatch(user1, user2.preferences);
  const avgPrefScore = (user1ToUser2Prefs.score + user2ToUser1Prefs.score) / 2;
  const prefPercentage = (avgPrefScore / (CONFIG.PREFERENCE_WEIGHTS.MUST_HAVE * 3)) * 100;

  // Personality
  const personalityScore = calculatePersonalityCompatibility(user1.details, user2.details);

  // Interests
  const interests1 = JSON.parse(user1.details.interests || '[]');
  const interests2 = JSON.parse(user2.details.interests || '[]');
  const interestScore = calculateInterestOverlap(interests1, interests2);

  // Communication style
  const commMatch = user1.details.communication_preference === user2.details.communication_preference ? 100 : 50;

  // Weighted average
  const overallScore =
    prefPercentage * 0.4 +
    personalityScore * 0.3 +
    interestScore * 0.2 +
    commMatch * 0.1;

  return {
    score: Math.round(overallScore),
    breakdown: {
      preferences: Math.round(prefPercentage),
      personality: Math.round(personalityScore),
      interests: Math.round(interestScore),
      communication: commMatch
    },
    isMatch: overallScore >= CONFIG.MATCH_THRESHOLD,
    tier: overallScore >= CONFIG.PERFECT_MATCH_THRESHOLD ? 'perfect' :
          overallScore >= CONFIG.GREAT_MATCH_THRESHOLD ? 'great' :
          overallScore >= CONFIG.MATCH_THRESHOLD ? 'good' : 'poor'
  };
}

// ============================================
// FEED GENERATION
// ============================================

/**
 * Generate personalized feed of potential matches
 *
 * Applies:
 * 1. Dating Socialism visibility weighting
 * 2. Fringe Dating boosts
 * 3. Compatibility filtering
 * 4. Connection mode filtering
 *
 * @param {Object} viewer - User viewing the feed
 * @param {Array} allUsers - All potential matches
 * @param {string} connectionMode - 'dating', 'casual', 'professional', 'platonic'
 * @param {Object} options - { limit, offset, includeOutsidePreferences }
 * @returns {Array} Ranked list of potential matches with scores
 */
function generateFeed(viewer, allUsers, connectionMode, options = {}) {
  const { limit = 20, offset = 0, includeOutsidePreferences = false } = options;

  // Filter out viewer and users not seeking this connection mode
  let candidates = allUsers.filter(user =>
    user.user_id !== viewer.user_id &&
    user[`seeking_${connectionMode}`] === 1
  );

  // Calculate median popularity for fringe boost
  const sortedLikes = candidates.map(u => u.likes_received_week).sort((a, b) => a - b);
  const medianPopularity = sortedLikes[Math.floor(sortedLikes.length / 2)] || 0;

  // Score each candidate
  const scoredCandidates = candidates.map(user => {
    const compatibility = calculateOverallCompatibility(viewer, user);
    const fringeBoost = calculateFringeBoost(user, viewer, medianPopularity);

    // Final display probability combines visibility, fringe boost, and compatibility
    const displayProbability = user.visibility_score * fringeBoost * (compatibility.score / 100);

    return {
      ...user,
      compatibility,
      fringeBoost,
      displayProbability,
      showInFeed: includeOutsidePreferences || compatibility.isMatch
    };
  });

  // Filter based on preferences (unless overridden)
  let feedCandidates = includeOutsidePreferences
    ? scoredCandidates
    : scoredCandidates.filter(c => c.showInFeed);

  // Sort by display probability (Dating Socialism + Fringe + Compatibility)
  feedCandidates.sort((a, b) => b.displayProbability - a.displayProbability);

  // Add some randomization to prevent staleness
  feedCandidates = shuffleTopN(feedCandidates, 10);

  // Paginate
  return feedCandidates.slice(offset, offset + limit);
}

function shuffleTopN(array, n) {
  // Shuffle top N results to add variety
  const topN = array.slice(0, n);
  const rest = array.slice(n);

  for (let i = topN.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [topN[i], topN[j]] = [topN[j], topN[i]];
  }

  return [...topN, ...rest];
}

// ============================================
// MATCH PROBABILITY CALCULATOR
// ============================================

/**
 * Calculate probability of seeing someone who liked you
 *
 * Increases with each swipe to encourage engagement
 *
 * @param {number} swipesThisSession - Number of swipes in current session
 * @param {number} totalLikesWaiting - Number of people who liked this user
 * @returns {number} Probability percentage (0-100)
 */
function calculateMatchProbability(swipesThisSession, totalLikesWaiting) {
  if (totalLikesWaiting === 0) return 0;

  // Base probability increases with swipes
  // Formula: min(95, 10 + swipes * 5)
  const baseProbability = Math.min(95, 10 + swipesThisSession * 5);

  // Scale by how many likes are waiting
  const scaledProbability = baseProbability * Math.min(1, totalLikesWaiting / 10);

  return Math.round(scaledProbability);
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Dating Socialism
  calculateVisibility,
  updateAllVisibilityScores,

  // Fringe Dating
  calculateFringeBoost,

  // Preference Matching
  evaluatePreferenceMatch,
  evaluateAgeTier,

  // Compatibility
  calculatePersonalityCompatibility,
  calculateInterestOverlap,
  calculateOverallCompatibility,

  // Feed Generation
  generateFeed,
  calculateMatchProbability,

  // Configuration
  CONFIG
};
