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
});

function initializeEventListeners() {
    // Mode selector
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentMode = e.currentTarget.dataset.mode;
            loadFeed();
        });
    });

    // User selector
    document.getElementById('currentUserId').addEventListener('change', (e) => {
        currentUserId = parseInt(e.target.value);
        loadUserStats();
        loadFeed();
    });

    // Swipe buttons
    document.getElementById('passBtn').addEventListener('click', () => handleSwipe('left'));
    document.getElementById('likeBtn').addEventListener('click', () => handleSwipe('right'));

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', loadFeed);

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
        const response = await fetch(`${API_BASE}/users?limit=100`);
        const data = await response.json();

        const select = document.getElementById('currentUserId');
        select.innerHTML = data.users.map(user =>
            `<option value="${user.user_id}" ${user.user_id === currentUserId ? 'selected' : ''}>
                ${user.display_name} (${user.age}, ${user.location_city})
            </option>`
        ).join('');
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

// Load user statistics
async function loadUserStats() {
    try {
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
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Load feed
async function loadFeed() {
    try {
        const response = await fetch(
            `${API_BASE}/feed/${currentUserId}?connectionMode=${currentMode}&limit=20`
        );
        const data = await response.json();

        currentFeed = data.feed;
        feedIndex = 0;

        if (currentFeed.length === 0) {
            showNoMoreProfiles();
        } else {
            showProfile(currentFeed[feedIndex]);
        }
    } catch (error) {
        console.error('Failed to load feed:', error);
    }
}

// Show profile
function showProfile(profile) {
    document.getElementById('profileCard').style.display = 'block';
    document.getElementById('noMoreProfiles').style.display = 'none';

    // Avatar (using DiceBear API)
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.avatar_seed}`;
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

        // Update match probability and likes waiting
        matchProbability = data.matchProbability || 0;
        likesWaiting = data.likesWaiting || 0;

        document.getElementById('matchProbability').textContent = matchProbability + '%';
        document.getElementById('likesWaiting').textContent = likesWaiting;

        // Show match modal if it's a match
        if (data.isMatch) {
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
    }
}

// Show match modal
function showMatchModal(matchedProfile) {
    const modal = document.getElementById('matchModal');
    const avatar1 = `https://api.dicebear.com/7.x/avataaars/svg?seed=user${currentUserId}`;
    const avatar2 = `https://api.dicebear.com/7.x/avataaars/svg?seed=${matchedProfile.avatar_seed}`;

    document.getElementById('matchAvatar1').src = avatar1;
    document.getElementById('matchAvatar2').src = avatar2;
    document.getElementById('matchText').textContent =
        `You and ${matchedProfile.display_name} matched!`;

    modal.style.display = 'flex';
}

// Close match modal
function closeMatchModal() {
    document.getElementById('matchModal').style.display = 'none';
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        handleSwipe('left');
    } else if (e.key === 'ArrowRight') {
        handleSwipe('right');
    }
});

console.log('🔮 Crystal Dating App initialized');
console.log('💡 Tip: Use arrow keys to swipe!');
