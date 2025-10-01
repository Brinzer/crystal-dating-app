/**
 * Chris Openheart Onboarding System
 * Conversational user profile creation with voice input
 */

const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:3500/api'
    : '/api';

// Conversation state
let conversationState = {
    step: 0,
    userData: {},
    totalSteps: 15
};

// Voice recognition setup
let recognition = null;
let isRecording = false;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initVoiceRecognition();
    initEventListeners();
    startConversation();
});

function initVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('userInput').value = transcript;
            handleUserMessage(transcript);
        };

        recognition.onend = () => {
            isRecording = false;
            document.getElementById('voiceBtn').classList.remove('recording');
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            isRecording = false;
            document.getElementById('voiceBtn').classList.remove('recording');
            if (event.error === 'not-allowed') {
                addChrisMessage("It looks like microphone access was denied. You can type your responses instead!");
            }
        };
    } else {
        console.log('Speech recognition not supported');
        document.getElementById('voiceBtn').style.display = 'none';
    }
}

function initEventListeners() {
    document.getElementById('voiceBtn').addEventListener('click', toggleVoiceInput);
    document.getElementById('sendBtn').addEventListener('click', () => {
        const input = document.getElementById('userInput');
        if (input.value.trim()) {
            handleUserMessage(input.value);
        }
    });
    document.getElementById('userInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && e.target.value.trim()) {
            handleUserMessage(e.target.value);
        }
    });
}

function toggleVoiceInput() {
    if (!recognition) return;

    if (isRecording) {
        recognition.stop();
    } else {
        recognition.start();
        isRecording = true;
        document.getElementById('voiceBtn').classList.add('recording');
    }
}

function startConversation() {
    // Get name from session storage (from signup)
    const signupName = sessionStorage.getItem('signupName');

    setTimeout(() => {
        if (signupName) {
            addChrisMessage(`Hello, ${signupName}! I'm Chris Openheart, and I'm here to help you create your Crystal Dating profile. 😊`);
            setTimeout(() => {
                addChrisMessage("Would you like me to call you something else, or is that name perfect? I won't change your profile name - nobody else will see another name - but if you want a true name that feels better, I'm here to change it for you. I want to make sure you feel comfortable throughout this process, because boy are we in for it!");
                setTimeout(() => {
                    // Skip to step 1 since we already have name
                    conversationState.userData.display_name = signupName;
                    conversationState.step = 1;
                    askNextQuestion();
                }, 2000);
            }, 2000);
        } else {
            addChrisMessage("Hey there! I'm Chris Openheart, and I'm here to help you create your Crystal Dating profile. 😊");
            setTimeout(() => {
                addChrisMessage("This will be super casual - just chat with me naturally, and I'll help you set everything up. Ready to start?");
                setTimeout(() => {
                    askNextQuestion();
                }, 1500);
            }, 2000);
        }
    }, 500);
}

function askNextQuestion() {
    const questions = [
        // Step 0: Name
        {
            text: "First things first - what's your name?",
            parse: parseBasicText,
            dataKey: 'display_name'
        },
        // Step 1: Age
        {
            text: "Nice to meet you! How old are you?",
            parse: parseAge,
            dataKey: 'age'
        },
        // Step 2: Gender
        {
            text: "What's your gender? You can say male, female, non-binary, or anything else you identify as.",
            parse: parseGender,
            dataKey: 'gender'
        },
        // Step 3: Location
        {
            text: "Where are you located? Just city and state is fine!",
            parse: parseLocation,
            dataKeys: ['location_city', 'location_state']
        },
        // Step 4: Age preferences
        {
            text: "Great! Now let's talk about preferences. What age range are you interested in? Like '25 to 35' or however you prefer.",
            parse: parseAgeRange,
            dataKeys: ['age_min_preferred', 'age_max_preferred']
        },
        // Step 5: Gender preferences
        {
            text: "And what gender(s) are you interested in meeting?",
            parse: parseGenderPreferences,
            dataKey: 'seeking_genders'
        },
        // Step 6: Height
        {
            text: "How tall are you? You can say feet/inches like '5 foot 10' or centimeters.",
            parse: parseHeight,
            dataKey: 'height_cm'
        },
        // Step 7: Interests
        {
            text: "Awesome! Now let's talk about you. What are your main interests or hobbies? Just list a few things you enjoy!",
            parse: parseInterests,
            dataKey: 'interests'
        },
        // Step 8: Lifestyle - Smoking
        {
            text: "Do you smoke? (Never, occasionally, regularly, or trying to quit)",
            parse: parseSmokingStatus,
            dataKey: 'smoking_status'
        },
        // Step 9: Lifestyle - Drinking
        {
            text: "How about drinking? (Never, socially, regularly, etc.)",
            parse: parseDrinkingFrequency,
            dataKey: 'drinking_frequency'
        },
        // Step 10: Education
        {
            text: "What's your education level? (High school, bachelor's, master's, etc.)",
            parse: parseEducation,
            dataKey: 'education_level'
        },
        // Step 11: Occupation
        {
            text: "What do you do for work?",
            parse: parseBasicText,
            dataKey: 'occupation'
        },
        // Step 12: Relationship goals
        {
            text: "What are you looking for? Dating, casual, friends, or something else?",
            parse: parseRelationshipGoals,
            dataKeys: ['seeking_dating', 'seeking_casual', 'seeking_platonic']
        },
        // Step 13: Bio
        {
            text: "Almost done! Tell me a bit about yourself - this will be your profile bio. Just a few sentences about who you are!",
            parse: parseBasicText,
            dataKey: 'bio'
        },
        // Step 14: Final
        {
            text: "Perfect! I've got everything I need. Let me create your profile...",
            parse: null,
            dataKey: null
        }
    ];

    if (conversationState.step < questions.length) {
        const question = questions[conversationState.step];
        updateProgress();
        setTimeout(() => {
            addChrisMessage(question.text);
        }, 1000);
    } else {
        createUserProfile();
    }
}

async function handleUserMessage(message) {
    // Clear input
    const input = document.getElementById('userInput');
    input.value = '';

    // Add user message to chat
    addUserMessage(message);

    // Show typing indicator
    document.getElementById('typingIndicator').classList.add('show');

    // Process the response
    setTimeout(() => {
        processUserResponse(message);
        document.getElementById('typingIndicator').classList.remove('show');
    }, 1500);
}

function processUserResponse(message) {
    const questions = [
        { parse: parseBasicText, dataKey: 'display_name' },
        { parse: parseAge, dataKey: 'age' },
        { parse: parseGender, dataKey: 'gender' },
        { parse: parseLocation, dataKeys: ['location_city', 'location_state'] },
        { parse: parseAgeRange, dataKeys: ['age_min_preferred', 'age_max_preferred'] },
        { parse: parseGenderPreferences, dataKey: 'seeking_genders' },
        { parse: parseHeight, dataKey: 'height_cm' },
        { parse: parseInterests, dataKey: 'interests' },
        { parse: parseSmokingStatus, dataKey: 'smoking_status' },
        { parse: parseDrinkingFrequency, dataKey: 'drinking_frequency' },
        { parse: parseEducation, dataKey: 'education_level' },
        { parse: parseBasicText, dataKey: 'occupation' },
        { parse: parseRelationshipGoals, dataKeys: ['seeking_dating', 'seeking_casual', 'seeking_platonic'] },
        { parse: parseBasicText, dataKey: 'bio' }
    ];

    const currentQuestion = questions[conversationState.step];
    const parsed = currentQuestion.parse(message);

    if (parsed) {
        // Store the data
        if (currentQuestion.dataKey) {
            conversationState.userData[currentQuestion.dataKey] = parsed;
        } else if (currentQuestion.dataKeys) {
            Object.assign(conversationState.userData, parsed);
        }

        // Acknowledge and move to next question
        const acknowledgments = [
            "Got it!",
            "Perfect!",
            "Great!",
            "Awesome!",
            "Nice!",
            "Cool!"
        ];
        const ack = acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
        addChrisMessage(ack);

        conversationState.step++;
        askNextQuestion();
    } else {
        addChrisMessage("Hmm, I didn't quite catch that. Could you try rephrasing?");
    }
}

// Parsing functions
function parseBasicText(text) {
    return text.trim();
}

function parseAge(text) {
    const match = text.match(/\d+/);
    return match ? parseInt(match[0]) : null;
}

function parseGender(text) {
    const lower = text.toLowerCase();
    if (lower.includes('male') && !lower.includes('female')) return 'male';
    if (lower.includes('female')) return 'female';
    if (lower.includes('non') || lower.includes('enby') || lower.includes('nb')) return 'nonbinary';
    return text.trim();
}

function parseLocation(text) {
    // Simple parsing: "San Francisco, CA" or "San Francisco CA"
    const parts = text.split(/[,\s]+/);
    if (parts.length >= 2) {
        const state = parts[parts.length - 1];
        const city = parts.slice(0, -1).join(' ');
        return { location_city: city, location_state: state };
    }
    return null;
}

function parseAgeRange(text) {
    const numbers = text.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
        return {
            age_min_preferred: parseInt(numbers[0]),
            age_max_preferred: parseInt(numbers[1]),
            age_min_musthave: parseInt(numbers[0]) - 5,
            age_max_musthave: parseInt(numbers[1]) + 5,
            age_min_acceptable: parseInt(numbers[0]) - 10,
            age_max_acceptable: parseInt(numbers[1]) + 10
        };
    }
    return null;
}

function parseGenderPreferences(text) {
    const lower = text.toLowerCase();
    const genders = [];
    if (lower.includes('male') && !lower.includes('female') && !lower.match(/\bfemale\b/)) genders.push('male');
    if (lower.includes('female') || lower.includes('women')) genders.push('female');
    if (lower.includes('non') || lower.includes('enby') || lower.includes('any') || lower.includes('all')) {
        genders.push('male', 'female', 'nonbinary');
    }
    return genders.length > 0 ? genders : ['male', 'female'];
}

function parseHeight(text) {
    // Parse "5'10" or "5 foot 10" or "178cm"
    const cmMatch = text.match(/(\d+)\s*cm/i);
    if (cmMatch) return parseInt(cmMatch[1]);

    const feetMatch = text.match(/(\d+)['\s]*(?:foot|feet|ft)?\s*(\d+)?/i);
    if (feetMatch) {
        const feet = parseInt(feetMatch[1]);
        const inches = feetMatch[2] ? parseInt(feetMatch[2]) : 0;
        return Math.round((feet * 12 + inches) * 2.54);
    }
    return 170; // Default
}

function parseInterests(text) {
    // Split by common separators
    const interests = text.split(/[,;]/).map(i => i.trim()).filter(i => i.length > 0);
    return interests.length > 0 ? interests : [text.trim()];
}

function parseSmokingStatus(text) {
    const lower = text.toLowerCase();
    if (lower.includes('never') || lower.includes('no') || lower.includes('don\'t')) return 'never';
    if (lower.includes('occasionally') || lower.includes('sometimes')) return 'occasionally';
    if (lower.includes('regular') || lower.includes('yes')) return 'regularly';
    if (lower.includes('quit') || lower.includes('trying')) return 'trying to quit';
    return 'never';
}

function parseDrinkingFrequency(text) {
    const lower = text.toLowerCase();
    if (lower.includes('never') || lower.includes('no') || lower.includes('don\'t')) return 'never';
    if (lower.includes('social') || lower.includes('sometimes')) return 'socially';
    if (lower.includes('regular') || lower.includes('often') || lower.includes('yes')) return 'regularly';
    return 'socially';
}

function parseEducation(text) {
    const lower = text.toLowerCase();
    if (lower.includes('high school') || lower.includes('hs')) return 'high school';
    if (lower.includes('bachelor') || lower.includes('undergrad') || lower.includes('college')) return 'bachelor degree';
    if (lower.includes('master') || lower.includes('graduate')) return 'master degree';
    if (lower.includes('phd') || lower.includes('doctor')) return 'phd';
    return text.trim();
}

function parseRelationshipGoals(text) {
    const lower = text.toLowerCase();
    return {
        seeking_dating: lower.includes('dating') || lower.includes('relationship') ? 1 : 0,
        seeking_casual: lower.includes('casual') || lower.includes('hookup') ? 1 : 0,
        seeking_platonic: lower.includes('friend') || lower.includes('platonic') ? 1 : 0,
        seeking_professional: 0
    };
}

// UI functions
function addChrisMessage(text) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message chris';
    messageDiv.innerHTML = `
        <div class="message-avatar" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">👤</div>
        <div class="message-content">${text}</div>
    `;
    messagesDiv.appendChild(messageDiv);

    // Scroll to bottom after render
    setTimeout(() => {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
}

function addUserMessage(text) {
    const messagesDiv = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.innerHTML = `
        <div class="message-avatar" style="background: #ddd; display: flex; align-items: center; justify-content: center; color: #666; font-size: 20px;">😊</div>
        <div class="message-content">${text}</div>
    `;
    messagesDiv.appendChild(messageDiv);

    // Scroll to bottom after render
    setTimeout(() => {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
}

function updateProgress() {
    const percent = Math.round((conversationState.step / conversationState.totalSteps) * 100);
    document.getElementById('progressPercent').textContent = percent;
    document.getElementById('progressFill').style.width = percent + '%';
}

async function createUserProfile() {
    addChrisMessage("Creating your profile now...");

    const profileData = {
        username: conversationState.userData.display_name?.toLowerCase().replace(/\s+/g, '') + Date.now(),
        display_name: conversationState.userData.display_name,
        age: conversationState.userData.age,
        gender: conversationState.userData.gender || 'male',
        sexual_orientation: 'heterosexual', // Default
        location_city: conversationState.userData.location_city,
        location_state: conversationState.userData.location_state,
        bio: conversationState.userData.bio,
        avatar_seed: conversationState.userData.username || conversationState.userData.display_name,
        details: {
            height_cm: conversationState.userData.height_cm || 170,
            smoking_status: conversationState.userData.smoking_status || 'never',
            drinking_frequency: conversationState.userData.drinking_frequency || 'socially',
            education_level: conversationState.userData.education_level || 'bachelor degree',
            occupation: conversationState.userData.occupation || 'professional',
            interests: conversationState.userData.interests || ['music', 'travel'],
            has_disability: 0
        },
        preferences: {
            age_min_preferred: conversationState.userData.age_min_preferred || 25,
            age_max_preferred: conversationState.userData.age_max_preferred || 35,
            age_min_musthave: conversationState.userData.age_min_musthave || 20,
            age_max_musthave: conversationState.userData.age_max_musthave || 40,
            age_min_acceptable: conversationState.userData.age_min_acceptable || 18,
            age_max_acceptable: conversationState.userData.age_max_acceptable || 50,
            seeking_genders: conversationState.userData.seeking_genders || ['male', 'female'],
            distance_max_km: 50
        },
        seeking_dating: conversationState.userData.seeking_dating || 1,
        seeking_casual: conversationState.userData.seeking_casual || 0,
        seeking_platonic: conversationState.userData.seeking_platonic || 0,
        seeking_professional: 0
    };

    try {
        const response = await fetch(`${API_BASE}/users/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
        });

        const result = await response.json();

        if (result.success) {
            setTimeout(() => {
                addChrisMessage(`🎉 All done! Your profile is ready. Welcome to Crystal Dating!`);
                setTimeout(() => {
                    addChrisMessage(`I'll take you to the app now...`);
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                }, 2000);
            }, 1000);
        } else {
            addChrisMessage("Oops, something went wrong creating your profile. Let's try again!");
        }
    } catch (error) {
        console.error('Error creating profile:', error);
        addChrisMessage("Sorry, there was an error. Please try again!");
    }
}

console.log('🎤 Onboarding system initialized with voice input support');
