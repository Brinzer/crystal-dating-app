# Crystal Dating App - Demo Guide

## 🎉 Pre-Alpha Demo v0.1.0

A fully functional dating app demo showcasing revolutionary matching algorithms.

---

## 🚀 Quick Start

### 1. Start the Backend Server

```bash
cd "e:\cursor projects\Crystal dating app"
node src/server/simpleServer.js
```

You should see:
```
🔮 Loading database: crystal_100.json
✅ Loaded 100 users

🔮 Crystal Dating App - Backend Server
📍 Running on: http://localhost:3500
```

### 2. Open the Frontend

Open `src/client/index.html` in your web browser.

---

## 🎮 How to Use

### Basic Navigation

1. **Select Connection Mode**: Choose Dating, Casual, Professional, or Platonic
2. **Switch Users**: Use the dropdown to view from different user perspectives
3. **Swipe**: Click ❤ (Like) or ✖ (Pass), or use arrow keys
4. **Watch Stats**: See your visibility score and match probability update in real-time

### Features to Try

#### 1. Dating Socialism in Action
- Switch to a highly-liked user → Note their LOW visibility score
- Switch to a rarely-liked user → Note their HIGH visibility score
- This equalizes match opportunities!

#### 2. Match Probability Tracker
- Start with 10-20% match probability
- Swipe through profiles
- Watch it increase to 90%+ as you engage
- Encourages active participation

#### 3. Fringe Dating Boost
- Look for profiles with the ✨ "Fringe Match" badge
- These are users outside mainstream preferences but within YOUR specific criteria
- They get boosted visibility just for you

#### 4. Compatibility Scoring
- Each profile shows a compatibility percentage
- Based on:
  - Preference matching (40%)
  - Personality compatibility (30%)
  - Interest overlap (20%)
  - Communication style (10%)

#### 5. Get a Match!
- Keep swiping right until you match with someone
- Enjoy the celebration modal! 🎉

---

## 📊 Understanding the Stats Dashboard

### Visibility Score
- **1.0x = Average**
- **> 1.0x = More visible** (fewer likes received)
- **< 1.0x = Less visible** (many likes received)
- This is Dating Socialism - equalizing opportunities!

### Match Probability
- Starts at 10-20%
- Increases with each swipe
- Shows your chance of seeing someone who already liked you
- Encourages engagement

### Likes Waiting
- Number of people who have liked you
- But you haven't seen their profile yet
- Keep swiping to find them!

### Platform Avg LPW
- Likes Per Week average across all users
- Your visibility is calculated relative to this number
- Shows how "Dating Socialism" balances the platform

---

## 🔬 Testing Different Scenarios

### Scenario 1: Popular User
1. Select a user with many `likes_received_week`
2. Notice their LOW visibility score (< 1.0)
3. They'll appear in fewer feeds
4. This prevents the "rich get richer" problem

### Scenario 2: Unpopular User
1. Select a user with few `likes_received_week`
2. Notice their HIGH visibility score (> 1.0)
3. They'll appear in MORE feeds
4. Everyone gets a fair chance!

### Scenario 3: Fringe Matching
1. Select a user with specific preferences
2. Look for users with disability, unique interests, etc.
3. See the "Fringe Match" badge
4. These users get boosted if they match YOUR criteria

---

## 🎨 Connection Modes

### Dating ❤️
- Romantic relationships
- Most popular mode
- Full algorithm features

### Casual 🔥
- Hookups and casual connections
- Same matching algorithm
- Different user pools

### Professional 💼
- Career networking
- Emphasis on skills and education
- Professional context

### Platonic 🤝
- Friendships
- No romantic intentions
- Social connections

---

## 🛠️ Technical Details

### Database
- **crystal_100.json** - 100 realistic users
- **crystal_1000.json** - 1,000 realistic users
- 15% disability representation
- Diverse demographics (age, ethnicity, location)

### Backend Endpoints
- `GET /api/status` - Server info
- `GET /api/users` - User list
- `GET /api/users/:id` - User profile
- `GET /api/users/:id/stats` - User statistics
- `GET /api/feed/:id` - Personalized match feed
- `POST /api/swipe` - Record swipe/like/match
- `GET /api/matches/:id` - User's matches
- `POST /api/users/create` - Create new user
- `GET /api/compatibility` - Calculate compatibility

### Algorithms
- **Dating Socialism**: Inverse popularity visibility
- **Fringe Dating**: Boost for niche users
- **Bullseye Preferences**: 4-tier matching system
- **Personality Compatibility**: Big Five traits
- **Interest Overlap**: Jaccard similarity

---

## 📁 Project Structure

```
crystal-dating-app/
├── src/
│   ├── algorithms/
│   │   └── matchingEngine.js      # Core matching algorithms
│   ├── server/
│   │   └── simpleServer.js        # Express API
│   ├── database/
│   │   ├── simpleGenerator.js     # User generator
│   │   ├── crystal_100.json       # 100 users
│   │   └── crystal_1000.json      # 1,000 users
│   └── client/
│       ├── index.html             # Main UI
│       ├── styles.css             # Crystal branding
│       └── app.js                 # Frontend logic
├── docs/
│   └── FEATURES.md                # Feature documentation
├── logs/
│   └── crystal_progress.log       # Development log
└── README.md                      # Project overview
```

---

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3500 is available
- Verify Node.js is installed: `node --version`
- Try: `npm install` first

### Frontend not loading data
- Ensure backend is running first
- Check browser console for errors
- Verify `API_BASE` URL in app.js matches server

### No profiles showing
- Refresh the feed with the button
- Try switching connection modes
- Check if database loaded (server console)

---

## 🎯 Next Steps

### Planned Features
- [ ] User creation/onboarding flow UI
- [ ] Comprehensive questionnaire
- [ ] Profile editing
- [ ] Messaging system
- [ ] Persistent database saves
- [ ] Advanced filtering
- [ ] Match analytics

---

## 📝 Notes

- This is a **pre-alpha demo** - not production ready
- Data is in-memory only (resets on server restart)
- No authentication/security implemented
- For demonstration purposes only

---

**Built with transparency, equity, and meaningful connection in mind.**

💎 Crystal Dating - Making dating clear.
