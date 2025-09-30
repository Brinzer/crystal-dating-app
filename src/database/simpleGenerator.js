/**
 * Crystal Dating App - Simple In-Memory Database Generator
 * For quick demo without SQLite compilation issues
 *
 * Generates JSON-based user database that can be loaded into memory
 */

const fs = require('fs');
const path = require('path');

// Reuse the same data pools from the original generator
const DATA = {
  firstNames: {
    male: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Christopher'],
    female: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen'],
    nonbinary: ['Alex', 'Jordan', 'Taylor', 'Casey', 'Riley', 'Morgan', 'Avery', 'Quinn', 'Sage', 'River']
  },
  lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'],
  cities: [
    { city: 'New York', state: 'NY' },
    { city: 'Los Angeles', state: 'CA' },
    { city: 'Chicago', state: 'IL' },
    { city: 'Houston', state: 'TX' },
    { city: 'Phoenix', state: 'AZ' },
    { city: 'Philadelphia', state: 'PA' },
    { city: 'San Antonio', state: 'TX' },
    { city: 'San Diego', state: 'CA' },
    { city: 'Dallas', state: 'TX' },
    { city: 'Austin', state: 'TX' }
  ],
  genders: ['male', 'female', 'nonbinary'],
  orientations: ['heterosexual', 'homosexual', 'bisexual', 'pansexual'],
  ethnicities: ['White', 'Black/African American', 'Hispanic/Latino', 'Asian', 'Mixed Race'],
  bodyTypes: ['slim', 'athletic', 'average', 'curvy', 'heavyset', 'muscular'],
  disabilities: [null, 'mobility impairment', 'visual impairment', 'hearing impairment', 'chronic illness'],
  educationLevels: ['high school', 'some college', 'bachelor degree', 'master degree', 'doctorate'],
  occupations: ['software engineer', 'teacher', 'nurse', 'artist', 'manager', 'student', 'entrepreneur'],
  interests: ['hiking', 'reading', 'cooking', 'travel', 'music', 'movies', 'gaming', 'fitness', 'yoga', 'photography'],
  religions: ['agnostic', 'atheist', 'christian', 'jewish', 'spiritual'],
  politicalViews: ['liberal', 'moderate', 'conservative', 'apolitical']
};

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[random(0, array.length - 1)];
}

function randomChoices(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

function generateAge() {
  const ranges = [
    { min: 18, max: 25, weight: 30 },
    { min: 26, max: 35, weight: 35 },
    { min: 36, max: 45, weight: 20 },
    { min: 46, max: 60, weight: 15 }
  ];
  const range = randomChoice(ranges);
  return random(range.min, range.max);
}

function generateGender() {
  return randomChoice(['female', 'male', 'nonbinary']);
}

function generateUser(userId) {
  const gender = generateGender();
  const age = generateAge();
  const location = randomChoice(DATA.cities);
  const occupation = randomChoice(DATA.occupations);
  const education = randomChoice(DATA.educationLevels);
  const disability = Math.random() < 0.15 ? randomChoice(DATA.disabilities.slice(1)) : null;

  let firstNamePool;
  if (gender === 'male') firstNamePool = DATA.firstNames.male;
  else if (gender === 'female') firstNamePool = DATA.firstNames.female;
  else firstNamePool = DATA.firstNames.nonbinary;

  const firstName = randomChoice(firstNamePool);
  const lastName = randomChoice(DATA.lastNames);
  const displayName = `${firstName} ${lastName.charAt(0)}.`;
  const username = `${firstName.toLowerCase()}${userId}`;

  const interests = randomChoices(DATA.interests, random(3, 6));

  // Seeking modes
  const seeking = {
    seeking_dating: Math.random() < 0.8 ? 1 : 0,
    seeking_casual: Math.random() < 0.3 ? 1 : 0,
    seeking_professional: Math.random() < 0.15 ? 1 : 0,
    seeking_platonic: Math.random() < 0.25 ? 1 : 0
  };

  if (!Object.values(seeking).some(v => v === 1)) {
    seeking.seeking_dating = 1;
  }

  // Generate bio
  const bios = [
    `${age} year old from ${location.city}. Love ${interests[0]} and ${interests[1]}.`,
    `Looking for genuine connections. Passionate about ${interests[0]}. ${occupation}.`,
    `${education} graduate. Enjoy ${interests[0]} and ${interests[1]}. Let's chat!`,
    `Life enthusiast. ${occupation}. Into ${interests[0]} and good conversation.`
  ];

  const user = {
    user_id: userId,
    username,
    display_name: displayName,
    age,
    gender,
    sexual_orientation: randomChoice(DATA.orientations),
    location_city: location.city,
    location_state: location.state,
    bio: randomChoice(bios),
    avatar_seed: username,

    // Visibility metrics
    visibility_score: 1.0,
    likes_received_week: random(0, 20),
    likes_given_week: random(0, 30),
    swipes_week: random(0, 50),
    matches_total: random(0, 10),

    ...seeking,

    // Profile details
    details: {
      height_cm: random(150, 200),
      body_type: randomChoice(DATA.bodyTypes),
      ethnicity: randomChoice(DATA.ethnicities),
      smoking_status: randomChoice(['never', 'occasionally', 'regularly']),
      drinking_frequency: randomChoice(['never', 'socially', 'regularly']),
      education_level: education,
      occupation,
      has_disability: disability ? 1 : 0,
      disability_type: disability,
      has_children_number: age > 25 && Math.random() < 0.3 ? random(1, 2) : 0,
      religion: randomChoice(DATA.religions),
      political_views: randomChoice(DATA.politicalViews),

      // Big Five personality
      openness_score: random(1, 10),
      conscientiousness_score: random(1, 10),
      extraversion_score: random(1, 10),
      agreeableness_score: random(1, 10),
      neuroticism_score: random(1, 10),

      interests,
      communication_preference: randomChoice(['texting', 'calling', 'video', 'any'])
    },

    // Preferences
    preferences: {
      age_min_musthave: Math.max(18, age - 10),
      age_max_musthave: Math.min(75, age + 10),
      age_min_preferred: Math.max(18, age - 7),
      age_max_preferred: Math.min(75, age + 7),
      age_min_acceptable: Math.max(18, age - 15),
      age_max_acceptable: Math.min(75, age + 15),
      distance_max_km: randomChoice([50, 100, 200, 500]),
      seeking_genders: gender === 'male' ? ['female'] : gender === 'female' ? ['male'] : ['male', 'female'],
      smoking_tolerance: randomChoice(['dealbreaker', 'prefer_not', 'neutral', 'ok']),
      drinking_tolerance: randomChoice(['dealbreaker', 'prefer_not', 'neutral', 'ok']),
      children_preference: randomChoice(['dealbreaker_no', 'prefer_no', 'neutral', 'prefer_yes'])
    }
  };

  return user;
}

function generateDatabase(size) {
  console.log(`\n🔮 Generating ${size} user database...`);

  const users = [];
  for (let i = 1; i <= size; i++) {
    users.push(generateUser(i));
    if (i % 100 === 0) {
      console.log(`  Generated ${i}/${size} users...`);
    }
  }

  const database = {
    users,
    likes: [],
    matches: [],
    meta: {
      generated_at: new Date().toISOString(),
      user_count: size,
      version: '0.1.0-prealpha'
    }
  };

  const filename = `crystal_${size}.json`;
  const filepath = path.join(__dirname, filename);

  fs.writeFileSync(filepath, JSON.stringify(database, null, 2));

  const stats = fs.statSync(filepath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

  console.log(`\n✅ Database created: ${filename}`);
  console.log(`   Users: ${size}`);
  console.log(`   Size: ${sizeMB} MB\n`);

  return database;
}

// Generate all three sizes
console.log('🔮 Crystal Dating App - Simple Database Generator\n');

generateDatabase(100);
generateDatabase(1000);
// generateDatabase(10000); // Skip for now - too large

console.log('🎉 All databases generated!\n');
