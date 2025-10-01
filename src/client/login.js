/**
 * Crystal Dating - Login/Signup Page
 * Handles authentication and redirects to onboarding or main app
 */

const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:3500/api'
    : '/api';

// Get elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const showSignupLink = document.getElementById('showSignup');
const showLoginLink = document.getElementById('showLogin');

// Switch between login and signup
showSignupLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

// Handle login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        // For demo, just check if user exists and redirect
        const response = await fetch(`${API_BASE}/users?limit=100`);
        const data = await response.json();

        // Find user by email (for demo, we'll use username as email prefix)
        const emailPrefix = email.split('@')[0];
        const user = data.users.find(u =>
            u.username === emailPrefix ||
            u.display_name.toLowerCase() === emailPrefix.toLowerCase()
        );

        if (user) {
            // Store user ID
            localStorage.setItem('crystalUserId', user.user_id);
            localStorage.setItem('crystalUserName', user.display_name);

            // Redirect to main app
            window.location.href = 'index.html';
        } else {
            showError('loginError', 'User not found. Please sign up!');
        }
    } catch (error) {
        showError('loginError', 'Login failed. Please try again.');
        console.error('Login error:', error);
    }
});

// Handle signup
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    try {
        // Store temporary signup info
        sessionStorage.setItem('signupName', name);
        sessionStorage.setItem('signupEmail', email);

        // Redirect to onboarding to complete profile
        window.location.href = 'onboarding.html';
    } catch (error) {
        showError('signupError', 'Signup failed. Please try again.');
        console.error('Signup error:', error);
    }
});

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');

    setTimeout(() => {
        errorElement.classList.add('hidden');
    }, 5000);
}

// Removed auto-redirect check - always allow access to login page
// Users will be manually redirected after login/signup only

console.log('💎 Crystal Dating - Login page loaded');
