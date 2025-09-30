/**
 * Crystal Dating App - Frontend Application
 * Handles UI, API calls, and user interactions
 */

// Configuration
const API_BASE = 'http://localhost:3500/api';
let currentUserId = null;
let currentMode = 'dating';
let feedIndex = 0;
let currentFeed = [];
let matchProbability = 0;
let likesWaiting = 0;

// State
let isLoggedIn = false;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    checkLoginStatus();
    debugLogger.log('APP_INIT', { message: 'Crystal Dating App started' });
});

function initializeEventListeners() {
    // Mode selector
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentMode = e.currentTarget.dataset.mode;
            debugLogger.trackInteraction('MODE_CHANGE', { mode: currentMode });
            loadFeed();
        });
    });

    // User selector
    document.getElementById('currentUserId').addEventListener('change', (e) => {
        currentUserId = parseInt(e.target.value);
        debugLogger.trackInteraction('USER_CHANGE', { userId: currentUserId });
        loadUserStats();
        loadFeed();
    });

    // Swipe buttons
    document.getElementById('passBtn').addEventListener('click', () => {
        debugLogger.trackInteraction('SWIPE_PASS', { direction: 'left' });
        handleSwipe('left');
    });
    document.getElementById('likeBtn').addEventListener('click', () => {
        debugLogger.trackInteraction('SWIPE_LIKE', { direction: 'right' });
        handleSwipe('right');
    });

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        debugLogger.trackInteraction('REFRESH_FEED', {});
        loadFeed();
    });

    // Match modal close
    document.getElementById('closeMatchBtn').addEventListener('click', closeMatchModal);
}

// Check login status
function checkLoginStatus() {
    const savedUserId = localStorage.getItem('crystalUserId');
    if (savedUserId) {
        currentUserId = parseInt(savedUserId);
        isLoggedIn = true;
        showMainApp();
        loadUsers();
        loadUserStats();
        loadFeed();
    } else {
        showLoginScreen();
    }
}

// Show login/create account screen
function showLoginScreen() {
    // For now, just load first user as demo
    // TODO: Add proper login/signup UI
    currentUserId = 1;
    localStorage.setItem('crystalUserId', currentUserId);
    showMainApp();
    loadUsers();
    loadUserStats();
    loadFeed();
}

function showMainApp() {
    // App is already visible - just ensure it's ready
    document.body.classList.add('logged-in');
}

// Load available users for selector
async function loadUsers() {
    try {
        debugLogger.log('API_CALL', { endpoint: '/users', method: 'GET' }, 'api-call');
        const response = await fetch(`${API_BASE}/users?limit=100`);
        const data = await response.json();
        debugLogger.log('API_SUCCESS', { endpoint: '/users', count: data.users.length }, 'api-call');

        const select = document.getElementById('currentUserId');
        select.innerHTML = data.users.map(user =>
            `<option value="${user.user_id}" ${user.user_id === currentUserId ? 'selected' : ''}>
                ${user.display_name} (${user.age}, ${user.location_city})
            </option>`
        ).join('');
        debugLogger.trackUIState('user-selector', { loaded: true, count: data.users.length });
    } catch (error) {
        console.error('Failed to load users:', error);
        debugLogger.log('API_ERROR', { endpoint: '/users', error: error.message }, 'api-call');
    }
}

// Load user statistics
async function loadUserStats() {
    try {
        debugLogger.log('API_CALL', { endpoint: `/users/${currentUserId}/stats`, method: 'GET' }, 'api-call');
        const response = await fetch(`${API_BASE}/users/${currentUserId}/stats`);
        const data = await response.json();

        // Update stats display
        document.getElementById('visibilityScore').textContent =
            data.stats.visibility_score.toFixed(2) + 'x';
        document.getElementById('matchProbability').textContent =
            matchProbability + '%';
        document.getElementById('likesWaiting').textContent = likesWaiting;
        document.getElementById('platformAvg').textContent =
            parseFloat(data.stats.platform_average_lpw).toFixed(1);
        debugLogger.trackUIState('stats-dashboard', {
            visibility: data.stats.visibility_score,
            matchProb: matchProbability,
            likesWaiting: likesWaiting
        });
    } catch (error) {
        console.error('Failed to load stats:', error);
        debugLogger.log('API_ERROR', { endpoint: '/users/stats', error: error.message }, 'api-call');
    }
}

// Load feed
async function loadFeed() {
    try {
        debugLogger.log('API_CALL', {
            endpoint: `/feed/${currentUserId}`,
            method: 'GET',
            mode: currentMode
        }, 'feed-loading');
        const response = await fetch(
            `${API_BASE}/feed/${currentUserId}?connectionMode=${currentMode}&limit=20`
        );
        const data = await response.json();

        currentFeed = data.feed;
        feedIndex = 0;

        debugLogger.log('FEED_LOADED', {
            count: currentFeed.length,
            mode: currentMode
        }, 'feed-loading');

        if (currentFeed.length === 0) {
            showNoMoreProfiles();
        } else {
            showProfile(currentFeed[feedIndex]);
        }
    } catch (error) {
        console.error('Failed to load feed:', error);
        debugLogger.log('API_ERROR', { endpoint: '/feed', error: error.message }, 'feed-loading');
    }
}

// Show profile
function showProfile(profile) {
    debugLogger.trackUIState('profile-card', {
        userId: profile.user_id,
        name: profile.display_name,
        age: profile.age,
        compatibility: profile.compatibility?.score,
        feedIndex: feedIndex
    });

    document.getElementById('profileCard').style.display = 'block';
    document.getElementById('noMoreProfiles').style.display = 'none';

    // Avatar (using local generator)
    const avatarUrl = generateAvatarDataURL(profile.avatar_seed || profile.username);
    document.getElementById('profileAvatar').src = avatarUrl;

    // Basic info
    document.getElementById('profileName').textContent = profile.display_name;
    document.getElementById('profileAge').textContent = profile.age;
    document.getElementById('profileLocation').textContent =
        `${profile.location_city}, ${profile.location_state}`;
    document.getElementById('profileBio').textContent = profile.bio;

    // Compatibility
    if (profile.compatibility) {
        document.getElementById('compatScore').textContent =
            profile.compatibility.score + '%';

        // Preference tier badge
        const tierNames = {
            'MUST_HAVE': '🎯 Must-Have Match',
            'PREFERRED': '⭐ Preferred Match',
            'ACCEPTABLE': '✓ Acceptable Match',
            'OUTSIDE': '○ Outside Preferences'
        };
        document.getElementById('prefTier').textContent =
            tierNames[profile.compatibility.tier] || profile.compatibility.tier;

        // Fringe badge
        if (profile.fringeBoost > 1.2) {
            document.getElementById('fringeBadge').style.display = 'flex';
        } else {
            document.getElementById('fringeBadge').style.display = 'none';
        }
    }

    // Tags
    const tags = [];
    if (profile.details.occupation) tags.push(profile.details.occupation);
    if (profile.details.education_level) tags.push(profile.details.education_level);
    if (profile.details.interests) {
        profile.details.interests.slice(0, 3).forEach(interest => tags.push(interest));
    }

    document.getElementById('profileTags').innerHTML = tags
        .map(tag => `<span class="tag">${tag}</span>`)
        .join('');
}

// Show no more profiles
function showNoMoreProfiles() {
    document.getElementById('profileCard').style.display = 'none';
    document.getElementById('noMoreProfiles').style.display = 'block';
}

// Handle swipe
async function handleSwipe(direction) {
    if (currentFeed.length === 0) return;

    const profile = currentFeed[feedIndex];

    try {
        debugLogger.log('API_CALL', {
            endpoint: '/swipe',
            method: 'POST',
            direction: direction,
            swipedUser: profile.user_id
        }, 'swipe-buttons');

        const response = await fetch(`${API_BASE}/swipe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                swiperId: currentUserId,
                swipedId: profile.user_id,
                direction,
                connectionMode: currentMode
            })
        });

        const data = await response.json();

        debugLogger.log('SWIPE_RESULT', {
            direction: direction,
            isMatch: data.isMatch,
            matchProbability: data.matchProbability
        }, 'swipe-buttons');

        // Update match probability and likes waiting
        matchProbability = data.matchProbability || 0;
        likesWaiting = data.likesWaiting || 0;

        document.getElementById('matchProbability').textContent = matchProbability + '%';
        document.getElementById('likesWaiting').textContent = likesWaiting;

        // Show match modal if it's a match
        if (data.isMatch) {
            debugLogger.log('MATCH_DETECTED', {
                matchedUser: profile.user_id,
                matchedName: profile.display_name
            }, 'match-modal');
            showMatchModal(profile);
        }

        // Move to next profile
        feedIndex++;
        if (feedIndex < currentFeed.length) {
            showProfile(currentFeed[feedIndex]);
        } else {
            showNoMoreProfiles();
        }
    } catch (error) {
        console.error('Failed to record swipe:', error);
        debugLogger.log('API_ERROR', { endpoint: '/swipe', error: error.message }, 'swipe-buttons');
    }
}

// Show match modal
function showMatchModal(matchedProfile) {
    debugLogger.trackUIState('match-modal', {
        matchedUser: matchedProfile.user_id,
        matchedName: matchedProfile.display_name,
        visible: true
    });

    const modal = document.getElementById('matchModal');
    const avatar1 = generateAvatarDataURL(`user${currentUserId}`);
    const avatar2 = generateAvatarDataURL(matchedProfile.avatar_seed || matchedProfile.username);

    document.getElementById('matchAvatar1').src = avatar1;
    document.getElementById('matchAvatar2').src = avatar2;
    document.getElementById('matchText').textContent =
        `You and ${matchedProfile.display_name} matched!`;

    modal.style.display = 'flex';
}

// Close match modal
function closeMatchModal() {
    debugLogger.trackInteraction('CLOSE_MATCH_MODAL', {});
    debugLogger.trackUIState('match-modal', { visible: false });
    document.getElementById('matchModal').style.display = 'none';
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        debugLogger.trackInteraction('KEYBOARD_SWIPE', { key: 'ArrowLeft', direction: 'left' });
        handleSwipe('left');
    } else if (e.key === 'ArrowRight') {
        debugLogger.trackInteraction('KEYBOARD_SWIPE', { key: 'ArrowRight', direction: 'right' });
        handleSwipe('right');
    }
});

console.log('🔮 Crystal Dating App initialized');
console.log('💡 Tip: Use arrow keys to swipe!');
