/**
 * Crystal Dating App - User Database Generator
 * Generates 100 / 1,000 / 10,000 realistic fake profiles
 *
 * Features:
 * - Realistic demographic diversity
 * - Disabilities representation (15% of population)
 * - Varied ages, locations, preferences
 * - Compressed data storage
 * - Avatar generation via DiceBear
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================
const SIZES = {
  small: 100,
  medium: 1000,
  large: 10000
};

// ============================================
// DATA POOLS for Realistic Generation
// ============================================
const DATA = {
  firstNames: {
    male: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Andrew', 'Kenneth', 'Joshua', 'Kevin'],
    female: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Lisa', 'Nancy', 'Betty', 'Helen', 'Sandra', 'Donna', 'Carol', 'Ruth', 'Sharon', 'Michelle'],
    nonbinary: ['Alex', 'Jordan', 'Taylor', 'Casey', 'Riley', 'Morgan', 'Avery', 'Quinn', 'Sage', 'River', 'Phoenix', 'Rowan', 'Charlie', 'Blake', 'Dakota', 'Cameron', 'Skylar', 'Parker', 'Jamie', 'Reese']
  },

  lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green'],

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
    { city: 'Austin', state: 'TX' },
    { city: 'Seattle', state: 'WA' },
    { city: 'Denver', state: 'CO' },
    { city: 'Portland', state: 'OR' },
    { city: 'Miami', state: 'FL' },
    { city: 'Atlanta', state: 'GA' },
    { city: 'Boston', state: 'MA' },
    { city: 'San Francisco', state: 'CA' },
    { city: 'Detroit', state: 'MI' },
    { city: 'Minneapolis', state: 'MN' },
    { city: 'Nashville', state: 'TN' }
  ],

  genders: ['male', 'female', 'nonbinary', 'genderfluid', 'agender'],

  orientations: ['heterosexual', 'homosexual', 'bisexual', 'pansexual', 'asexual', 'demisexual', 'queer'],

  ethnicities: ['White', 'Black/African American', 'Hispanic/Latino', 'Asian', 'Native American', 'Pacific Islander', 'Middle Eastern', 'Mixed Race'],

  bodyTypes: ['slim', 'athletic', 'average', 'curvy', 'heavyset', 'muscular', 'petite'],

  disabilities: [
    null, // 85% no disability
    'mobility impairment',
    'visual impairment',
    'hearing impairment',
    'chronic illness',
    'mental health condition',
    'autism spectrum',
    'learning disability',
    'chronic pain'
  ],

  educationLevels: ['high school', 'some college', 'associate degree', 'bachelor degree', 'master degree', 'doctorate', 'trade school'],

  occupations: ['software engineer', 'teacher', 'nurse', 'sales', 'artist', 'manager', 'consultant', 'student', 'freelancer', 'entrepreneur', 'healthcare worker', 'retail', 'service industry', 'construction', 'finance', 'marketing', 'writer', 'designer', 'engineer', 'scientist'],

  interests: ['hiking', 'reading', 'cooking', 'travel', 'music', 'movies', 'gaming', 'fitness', 'yoga', 'photography', 'art', 'dancing', 'sports', 'volunteering', 'writing', 'technology', 'fashion', 'pets', 'gardening', 'meditation'],

  religions: ['agnostic', 'atheist', 'christian', 'catholic', 'jewish', 'muslim', 'hindu', 'buddhist', 'spiritual', 'other'],

  politicalViews: ['very liberal', 'liberal', 'moderate', 'conservative', 'very conservative', 'apolitical', 'other'],

  lifestyleChoices: {
    smoking: ['never', 'occasionally', 'regularly', 'trying to quit'],
    drinking: ['never', 'socially', 'regularly', 'rarely'],
    drugs: ['never', 'occasionally', 'cannabis only', 'prefer not to say']
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[random(0, array.length - 1)];
}

function randomChoices(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function weightedChoice(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let threshold = Math.random() * total;

  for (let i = 0; i < items.length; i++) {
    threshold -= weights[i];
    if (threshold < 0) return items[i];
  }
  return items[0];
}

function generateAge() {
  // Age distribution: 18-25 (30%), 26-35 (35%), 36-45 (20%), 46-60 (12%), 60+ (3%)
  const ranges = [
    { min: 18, max: 25, weight: 30 },
    { min: 26, max: 35, weight: 35 },
    { min: 36, max: 45, weight: 20 },
    { min: 46, max: 60, weight: 12 },
    { min: 61, max: 75, weight: 3 }
  ];

  const range = weightedChoice(ranges, ranges.map(r => r.weight));
  return random(range.min, range.max);
}

function generateGender() {
  // 48% female, 48% male, 4% nonbinary/other
  return weightedChoice(
    ['female', 'male', 'nonbinary', 'genderfluid', 'agender'],
    [48, 48, 2, 1, 1]
  );
}

function generateOrientation() {
  // Rough distribution
  return weightedChoice(
    DATA.orientations,
    [70, 10, 12, 5, 1, 1, 1]
  );
}

function generateDisability() {
  // 15% have some form of disability
  return Math.random() < 0.15 ? randomChoice(DATA.disabilities.slice(1)) : null;
}

function generateBio(user) {
  const templates = [
    `${user.age} year old from ${user.location_city}. Love ${randomChoice(DATA.interests)} and ${randomChoice(DATA.interests)}.`,
    `Looking for genuine connections. Passionate about ${randomChoice(DATA.interests)}. ${user.occupation}.`,
    `${user.education_level} graduate. Enjoy ${randomChoice(DATA.interests)} and ${randomChoice(DATA.interests)}. Let's chat!`,
    `Life enthusiast. ${user.occupation}. Into ${randomChoice(DATA.interests)} and good conversation.`,
    `${user.location_city} local. Love to ${randomChoice(DATA.interests)}. Looking for meaningful connections.`
  ];

  return randomChoice(templates);
}

function generateSeekingModes() {
  // Most people seek dating (80%), some also seek other modes
  const modes = {
    seeking_dating: Math.random() < 0.8 ? 1 : 0,
    seeking_casual: Math.random() < 0.3 ? 1 : 0,
    seeking_professional: Math.random() < 0.15 ? 1 : 0,
    seeking_platonic: Math.random() < 0.25 ? 1 : 0
  };

  // Ensure at least one mode is active
  if (!Object.values(modes).some(v => v === 1)) {
    modes.seeking_dating = 1;
  }

  return modes;
}

// ============================================
// USER GENERATION
// ============================================

function generateUser(index) {
  const gender = generateGender();
  const age = generateAge();
  const location = randomChoice(DATA.cities);
  const occupation = randomChoice(DATA.occupations);
  const education = randomChoice(DATA.educationLevels);
  const disability = generateDisability();
  const seeking = generateSeekingModes();

  // Select appropriate first name based on gender
  let firstNamePool;
  if (gender === 'male') firstNamePool = DATA.firstNames.male;
  else if (gender === 'female') firstNamePool = DATA.firstNames.female;
  else firstNamePool = DATA.firstNames.nonbinary;

  const firstName = randomChoice(firstNamePool);
  const lastName = randomChoice(DATA.lastNames);
  const displayName = `${firstName} ${lastName.charAt(0)}.`;
  const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${random(100, 999)}`;
  const email = `${username}@example.com`;

  // Avatar seed for DiceBear
  const avatarSeed = `${username}-${index}`;

  const user = {
    username,
    email,
    display_name: displayName,
    age,
    gender,
    sexual_orientation: generateOrientation(),
    location_city: location.city,
    location_state: location.state,
    location_country: 'USA',
    bio: '',
    avatar_seed: avatarSeed,
    ...seeking
  };

  // Detailed profile
  const details = {
    height_cm: random(150, 200),
    body_type: randomChoice(DATA.bodyTypes),
    ethnicity: randomChoice(DATA.ethnicities),
    hair_color: randomChoice(['black', 'brown', 'blonde', 'red', 'gray', 'bald', 'other']),
    eye_color: randomChoice(['brown', 'blue', 'green', 'hazel', 'gray']),

    smoking_status: randomChoice(DATA.lifestyleChoices.smoking),
    drinking_frequency: randomChoice(DATA.lifestyleChoices.drinking),
    drug_use: randomChoice(DATA.lifestyleChoices.drugs),
    exercise_frequency: randomChoice(['never', 'rarely', 'sometimes', 'regularly', 'daily']),
    diet_type: randomChoice(['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'other']),

    education_level: education,
    occupation,
    income_range: randomChoice(['< $30k', '$30-50k', '$50-75k', '$75-100k', '$100-150k', '$150k+', 'prefer not to say']),
    has_disability: disability ? 1 : 0,
    disability_type: disability,
    disability_visibility: disability ? randomChoice(['visible', 'invisible', 'sometimes']) : null,

    relationship_status: randomChoice(['single', 'divorced', 'widowed']),
    has_children_number: age > 25 && Math.random() < 0.3 ? random(1, 3) : 0,
    living_situation: randomChoice(['alone', 'with roommates', 'with family', 'with partner']),

    religion: randomChoice(DATA.religions),
    religion_importance: randomChoice(['not important', 'somewhat important', 'important', 'very important']),
    political_views: randomChoice(DATA.politicalViews),
    political_importance: randomChoice(['not important', 'somewhat important', 'important', 'very important']),

    // Big Five personality (1-10 scale)
    openness_score: random(1, 10),
    conscientiousness_score: random(1, 10),
    extraversion_score: random(1, 10),
    agreeableness_score: random(1, 10),
    neuroticism_score: random(1, 10),

    interests: JSON.stringify(randomChoices(DATA.interests, random(3, 8))),
    hobbies: JSON.stringify(randomChoices(DATA.interests, random(2, 5))),

    communication_preference: randomChoice(['texting', 'calling', 'video', 'in person', 'any']),
    response_time_preference: randomChoice(['immediate', 'within hours', 'within days', 'flexible'])
  };

  // Generate bio using collected data
  user.bio = generateBio({ ...user, occupation, education_level: education });

  // Preferences
  const preferences = generatePreferences(user, details);

  return { user, details, preferences };
}

function generatePreferences(user, details) {
  const ageRange = 10;
  const minAge = Math.max(18, user.age - ageRange);
  const maxAge = Math.min(75, user.age + ageRange);

  // Determine seeking genders based on orientation
  let seekingGenders = [];
  if (user.sexual_orientation === 'heterosexual') {
    seekingGenders = user.gender === 'male' ? ['female'] : user.gender === 'female' ? ['male'] : ['male', 'female'];
  } else if (user.sexual_orientation === 'homosexual') {
    seekingGenders = [user.gender];
  } else {
    seekingGenders = ['male', 'female', 'nonbinary'];
  }

  return {
    // Bullseye age preferences
    age_min_musthave: minAge,
    age_max_musthave: maxAge,
    age_min_preferred: Math.max(18, user.age - ageRange * 0.7),
    age_max_preferred: Math.min(75, user.age + ageRange * 0.7),
    age_min_acceptable: Math.max(18, user.age - ageRange * 1.5),
    age_max_acceptable: Math.min(75, user.age + ageRange * 1.5),

    distance_max_km: randomChoice([25, 50, 100, 200, 500, 10000]), // 10000 = anywhere
    willing_to_relocate: Math.random() < 0.2 ? 1 : 0,
    willing_long_distance: Math.random() < 0.3 ? 1 : 0,
    travel_frequency: randomChoice(['never', 'rarely', 'sometimes', 'often', 'frequently']),

    seeking_genders: JSON.stringify(seekingGenders),
    seeking_orientations: JSON.stringify([user.sexual_orientation]),

    height_min_cm: random(150, 170),
    height_max_cm: random(175, 200),
    body_type_prefs: JSON.stringify(randomChoices(DATA.bodyTypes, random(2, 4))),

    smoking_tolerance: randomChoice(['dealbreaker', 'prefer_not', 'neutral', 'ok']),
    drinking_tolerance: randomChoice(['dealbreaker', 'prefer_not', 'neutral', 'ok']),
    drugs_tolerance: randomChoice(['dealbreaker', 'prefer_not', 'neutral', 'ok']),

    has_children: details.has_children_number > 0 ? 'yes' : 'no',
    wants_children: randomChoice(['yes', 'no', 'maybe', 'not_sure']),
    children_preference: randomChoice(['dealbreaker_no', 'prefer_no', 'neutral', 'prefer_yes', 'must_have']),

    education_level_min: randomChoice(['high school', 'some college', 'bachelor degree', 'master degree']),
    career_importance: randomChoice(['not_important', 'somewhat', 'important', 'very_important']),

    religion_importance: details.religion_importance,
    religion_compatibility_required: Math.random() < 0.3 ? 1 : 0,
    political_importance: details.political_importance,
    political_compatibility_required: Math.random() < 0.2 ? 1 : 0
  };
}

// ============================================
// DATABASE CREATION
// ============================================

function createDatabase(size, filename) {
  console.log(`\n🔨 Creating ${size}-user database: ${filename}`);

  const dbPath = path.join(__dirname, filename);

  // Delete existing database
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const db = new Database(dbPath);

  // Read and execute schema
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);

  // Prepare insert statements
  const insertUser = db.prepare(`
    INSERT INTO users (
      username, email, display_name, age, gender, sexual_orientation,
      location_city, location_state, location_country, bio, avatar_seed,
      seeking_dating, seeking_casual, seeking_professional, seeking_platonic
    ) VALUES (
      @username, @email, @display_name, @age, @gender, @sexual_orientation,
      @location_city, @location_state, @location_country, @bio, @avatar_seed,
      @seeking_dating, @seeking_casual, @seeking_professional, @seeking_platonic
    )
  `);

  const insertDetails = db.prepare(`
    INSERT INTO user_profile_details (
      user_id, height_cm, body_type, ethnicity, hair_color, eye_color,
      smoking_status, drinking_frequency, drug_use, exercise_frequency, diet_type,
      education_level, occupation, income_range, has_disability, disability_type, disability_visibility,
      relationship_status, has_children_number, living_situation,
      religion, religion_importance, political_views, political_importance,
      openness_score, conscientiousness_score, extraversion_score, agreeableness_score, neuroticism_score,
      interests, hobbies, communication_preference, response_time_preference
    ) VALUES (
      @user_id, @height_cm, @body_type, @ethnicity, @hair_color, @eye_color,
      @smoking_status, @drinking_frequency, @drug_use, @exercise_frequency, @diet_type,
      @education_level, @occupation, @income_range, @has_disability, @disability_type, @disability_visibility,
      @relationship_status, @has_children_number, @living_situation,
      @religion, @religion_importance, @political_views, @political_importance,
      @openness_score, @conscientiousness_score, @extraversion_score, @agreeableness_score, @neuroticism_score,
      @interests, @hobbies, @communication_preference, @response_time_preference
    )
  `);

  const insertPreferences = db.prepare(`
    INSERT INTO user_preferences (
      user_id, age_min_musthave, age_max_musthave, age_min_preferred, age_max_preferred, age_min_acceptable, age_max_acceptable,
      distance_max_km, willing_to_relocate, willing_long_distance, travel_frequency,
      seeking_genders, seeking_orientations, height_min_cm, height_max_cm, body_type_prefs,
      smoking_tolerance, drinking_tolerance, drugs_tolerance,
      has_children, wants_children, children_preference,
      education_level_min, career_importance,
      religion_importance, religion_compatibility_required, political_importance, political_compatibility_required
    ) VALUES (
      @user_id, @age_min_musthave, @age_max_musthave, @age_min_preferred, @age_max_preferred, @age_min_acceptable, @age_max_acceptable,
      @distance_max_km, @willing_to_relocate, @willing_long_distance, @travel_frequency,
      @seeking_genders, @seeking_orientations, @height_min_cm, @height_max_cm, @body_type_prefs,
      @smoking_tolerance, @drinking_tolerance, @drugs_tolerance,
      @has_children, @wants_children, @children_preference,
      @education_level_min, @career_importance,
      @religion_importance, @religion_compatibility_required, @political_importance, @political_compatibility_required
    )
  `);

  // Generate and insert users
  const insertAll = db.transaction((users) => {
    for (let i = 0; i < users.length; i++) {
      const { user, details, preferences } = users[i];

      const info = insertUser.run(user);
      const userId = info.lastInsertRowid;

      insertDetails.run({ user_id: userId, ...details });
      insertPreferences.run({ user_id: userId, ...preferences });

      if ((i + 1) % 100 === 0) {
        console.log(`  Generated ${i + 1}/${users.length} users...`);
      }
    }
  });

  console.log('  Generating user data...');
  const users = [];
  for (let i = 0; i < size; i++) {
    users.push(generateUser(i));
  }

  console.log('  Inserting into database...');
  insertAll(users);

  // Get database size
  const stats = fs.statSync(dbPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

  console.log(`\n✅ Database created successfully!`);
  console.log(`   File: ${filename}`);
  console.log(`   Users: ${size}`);
  console.log(`   Size: ${sizeMB} MB`);
  console.log(`   Compression: ${(stats.size / size).toFixed(0)} bytes/user\n`);

  db.close();
}

// ============================================
// MAIN EXECUTION
// ============================================

console.log('🔮 Crystal Dating App - User Database Generator\n');
console.log('Generating databases with realistic diversity...\n');

// Generate all three database sizes
createDatabase(SIZES.small, 'crystal_100.db');
createDatabase(SIZES.medium, 'crystal_1000.db');
createDatabase(SIZES.large, 'crystal_10000.db');

console.log('🎉 All databases generated successfully!\n');
