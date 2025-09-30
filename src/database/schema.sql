-- Crystal Dating App Database Schema
-- Designed for modularity and comprehensive user profiling

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- Basic Profile
    display_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    sexual_orientation TEXT NOT NULL,
    location_city TEXT,
    location_state TEXT,
    location_country TEXT DEFAULT 'USA',
    bio TEXT,
    avatar_seed TEXT, -- For DiceBear API

    -- Visibility & Popularity Metrics
    visibility_score REAL DEFAULT 1.0,
    likes_received_week INTEGER DEFAULT 0,
    likes_given_week INTEGER DEFAULT 0,
    swipes_week INTEGER DEFAULT 0,
    matches_total INTEGER DEFAULT 0,

    -- Connection Mode Preferences (can seek multiple simultaneously)
    seeking_dating BOOLEAN DEFAULT 1,
    seeking_casual BOOLEAN DEFAULT 0,
    seeking_professional BOOLEAN DEFAULT 0,
    seeking_platonic BOOLEAN DEFAULT 0,

    -- Account Status
    is_active BOOLEAN DEFAULT 1,
    is_verified BOOLEAN DEFAULT 0
);

-- ============================================
-- USER_PREFERENCES TABLE
-- Bullseye/Ranked Preference System
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
    pref_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,

    -- Age Preferences (Bullseye Tiers)
    age_min_musthave INTEGER,
    age_max_musthave INTEGER,
    age_min_preferred INTEGER,
    age_max_preferred INTEGER,
    age_min_acceptable INTEGER,
    age_max_acceptable INTEGER,

    -- Distance/Location Preferences
    distance_max_km INTEGER DEFAULT 50,
    willing_to_relocate BOOLEAN DEFAULT 0,
    willing_long_distance BOOLEAN DEFAULT 0,
    travel_frequency TEXT, -- 'never', 'rarely', 'sometimes', 'often', 'frequently'

    -- Gender & Orientation Matching
    seeking_genders TEXT, -- JSON array: ['male', 'female', 'nonbinary', 'other']
    seeking_orientations TEXT, -- JSON array

    -- Physical Preferences (Privacy: can be hidden)
    height_min_cm INTEGER,
    height_max_cm INTEGER,
    body_type_prefs TEXT, -- JSON array

    -- Lifestyle Preferences
    smoking_tolerance TEXT, -- 'dealbreaker', 'prefer_not', 'neutral', 'ok'
    drinking_tolerance TEXT,
    drugs_tolerance TEXT,

    -- Children & Family
    has_children TEXT, -- 'yes', 'no', 'prefer_not_say'
    wants_children TEXT, -- 'yes', 'no', 'maybe', 'not_sure'
    children_preference TEXT, -- 'dealbreaker_no', 'prefer_no', 'neutral', 'prefer_yes', 'must_have'

    -- Education & Career
    education_level_min TEXT,
    career_importance TEXT, -- 'not_important', 'somewhat', 'important', 'very_important'

    -- Religion & Politics
    religion_importance TEXT,
    religion_compatibility_required BOOLEAN DEFAULT 0,
    political_importance TEXT,
    political_compatibility_required BOOLEAN DEFAULT 0,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================
-- USER_PROFILE_DETAILS TABLE
-- Comprehensive Questionnaire Answers
-- ============================================
CREATE TABLE IF NOT EXISTS user_profile_details (
    detail_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,

    -- Physical Attributes
    height_cm INTEGER,
    body_type TEXT,
    ethnicity TEXT,
    hair_color TEXT,
    eye_color TEXT,

    -- Lifestyle
    smoking_status TEXT,
    drinking_frequency TEXT,
    drug_use TEXT,
    exercise_frequency TEXT,
    diet_type TEXT, -- 'omnivore', 'vegetarian', 'vegan', 'other'

    -- Personal Background
    education_level TEXT,
    occupation TEXT,
    income_range TEXT,
    has_disability BOOLEAN DEFAULT 0,
    disability_type TEXT,
    disability_visibility TEXT, -- 'visible', 'invisible', 'sometimes'

    -- Family & Relationships
    relationship_status TEXT, -- 'single', 'divorced', 'widowed'
    has_children_number INTEGER DEFAULT 0,
    living_situation TEXT,

    -- Beliefs & Values
    religion TEXT,
    religion_importance TEXT,
    political_views TEXT,
    political_importance TEXT,

    -- Personality Traits (Big Five)
    openness_score INTEGER, -- 1-10
    conscientiousness_score INTEGER,
    extraversion_score INTEGER,
    agreeableness_score INTEGER,
    neuroticism_score INTEGER,

    -- Interests & Hobbies (JSON array)
    interests TEXT,
    hobbies TEXT,

    -- Communication Style
    communication_preference TEXT, -- 'texting', 'calling', 'video', 'in_person'
    response_time_preference TEXT, -- 'immediate', 'hours', 'days'

    -- Privacy Settings
    profile_public BOOLEAN DEFAULT 1,
    show_last_active BOOLEAN DEFAULT 1,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================
-- LIKES TABLE
-- Track who liked whom
-- ============================================
CREATE TABLE IF NOT EXISTS likes (
    like_id INTEGER PRIMARY KEY AUTOINCREMENT,
    liker_id INTEGER NOT NULL,
    liked_id INTEGER NOT NULL,
    connection_mode TEXT NOT NULL, -- 'dating', 'casual', 'professional', 'platonic'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_match BOOLEAN DEFAULT 0,

    FOREIGN KEY (liker_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (liked_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(liker_id, liked_id, connection_mode)
);

-- ============================================
-- MATCHES TABLE
-- When two users like each other
-- ============================================
CREATE TABLE IF NOT EXISTS matches (
    match_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER NOT NULL,
    user2_id INTEGER NOT NULL,
    connection_mode TEXT NOT NULL,
    matched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    first_message_sent_by INTEGER, -- user_id of first to message
    conversation_active BOOLEAN DEFAULT 1,

    FOREIGN KEY (user1_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE(user1_id, user2_id, connection_mode)
);

-- ============================================
-- FEEDBACK TABLE
-- Profile feedback and post-date reviews
-- ============================================
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
    reviewer_id INTEGER NOT NULL,
    reviewed_id INTEGER NOT NULL,
    feedback_type TEXT NOT NULL, -- 'profile_survey', 'post_date', 'unmatch', 'block'
    feedback_data TEXT, -- JSON object with feedback details
    is_anonymous BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (reviewer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================
-- VISIBILITY_LOG TABLE
-- Track visibility changes for transparency
-- ============================================
CREATE TABLE IF NOT EXISTS visibility_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    visibility_score REAL NOT NULL,
    likes_received_week INTEGER NOT NULL,
    average_likes_week REAL NOT NULL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================
-- SWIPE_HISTORY TABLE
-- Track all swipes for match chance calculations
-- ============================================
CREATE TABLE IF NOT EXISTS swipe_history (
    swipe_id INTEGER PRIMARY KEY AUTOINCREMENT,
    swiper_id INTEGER NOT NULL,
    swiped_id INTEGER NOT NULL,
    swipe_direction TEXT NOT NULL, -- 'right' (like), 'left' (pass)
    connection_mode TEXT NOT NULL,
    swiped_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (swiper_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (swiped_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================
-- INDICES for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location_city, location_state);
CREATE INDEX IF NOT EXISTS idx_users_age ON users(age);
CREATE INDEX IF NOT EXISTS idx_users_visibility ON users(visibility_score);
CREATE INDEX IF NOT EXISTS idx_likes_liker ON likes(liker_id);
CREATE INDEX IF NOT EXISTS idx_likes_liked ON likes(liked_id);
CREATE INDEX IF NOT EXISTS idx_matches_users ON matches(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_swipes_swiper ON swipe_history(swiper_id);
