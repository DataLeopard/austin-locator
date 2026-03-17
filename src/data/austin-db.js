import initSqlJs from 'sql.js';

let db = null;

const NEIGHBORHOODS = [
  { name: 'Downtown', area: 'Central', lat: 30.2672, lng: -97.7431, vibe: 'Urban,Walkable,Nightlife', walkScore: 89, transitScore: 72, avgRent1br: 1850, avgRent2br: 2650, avgRent3br: 3400, petFriendly: 1, nightlife: 95, outdoors: 40, familyFriendly: 30, techHub: 85, description: 'The heart of Austin with high-rises, live music on 6th Street, and walkable urban living. Steps from Lady Bird Lake hike-and-bike trail.' },
  { name: 'East Austin', area: 'East', lat: 30.2598, lng: -97.7177, vibe: 'Artsy,Diverse,Trendy', walkScore: 72, transitScore: 48, avgRent1br: 1450, avgRent2br: 2100, avgRent3br: 2800, petFriendly: 1, nightlife: 80, outdoors: 55, familyFriendly: 50, techHub: 60, description: 'Austin\'s most dynamic neighborhood with street art, craft breweries, food trucks, and a thriving creative scene. Rapidly growing with new development.' },
  { name: 'South Congress (SoCo)', area: 'South', lat: 30.2460, lng: -97.7487, vibe: 'Eclectic,Shopping,Iconic', walkScore: 78, transitScore: 45, avgRent1br: 1650, avgRent2br: 2400, avgRent3br: 3100, petFriendly: 1, nightlife: 75, outdoors: 60, familyFriendly: 45, techHub: 50, description: 'The iconic "I Love You So Much" mural, vintage shops, food trailers, and a funky vibe. Walking distance to downtown across the Congress Ave bridge.' },
  { name: 'Hyde Park', area: 'Central', lat: 30.3050, lng: -97.7340, vibe: 'Historic,Quiet,Charming', walkScore: 70, transitScore: 42, avgRent1br: 1250, avgRent2br: 1850, avgRent3br: 2400, petFriendly: 1, nightlife: 25, outdoors: 65, familyFriendly: 85, techHub: 40, description: 'Austin\'s first suburb with tree-lined streets, historic bungalows, and a strong neighborhood feel. Home to Shipe Park and local coffee shops.' },
  { name: 'Mueller', area: 'East', lat: 30.2980, lng: -97.7050, vibe: 'New,Planned,Family', walkScore: 65, transitScore: 38, avgRent1br: 1400, avgRent2br: 2050, avgRent3br: 2700, petFriendly: 1, nightlife: 20, outdoors: 70, familyFriendly: 90, techHub: 55, description: 'Master-planned community on former airport land with parks, trails, Thinkery children\'s museum, and a mix of housing. Very family-oriented.' },
  { name: 'The Domain', area: 'North', lat: 30.4020, lng: -97.7254, vibe: 'Upscale,Shopping,Corporate', walkScore: 75, transitScore: 40, avgRent1br: 1550, avgRent2br: 2300, avgRent3br: 3000, petFriendly: 1, nightlife: 65, outdoors: 30, familyFriendly: 40, techHub: 95, description: 'Austin\'s "second downtown" with luxury shopping, restaurants, and offices for Apple, Meta, Amazon. Modern high-rise living near major tech employers.' },
  { name: 'Cedar Park', area: 'Suburbs', lat: 30.5052, lng: -97.8203, vibe: 'Suburban,Affordable,Growing', walkScore: 30, transitScore: 15, avgRent1br: 1150, avgRent2br: 1550, avgRent3br: 2000, petFriendly: 1, nightlife: 15, outdoors: 60, familyFriendly: 90, techHub: 35, description: 'Growing suburb north of Austin with good schools, new development, H-E-B Center, and more affordable rents. Quick access to 183A toll road.' },
  { name: 'Round Rock', area: 'Suburbs', lat: 30.5083, lng: -97.6789, vibe: 'Suburban,Family,Affordable', walkScore: 25, transitScore: 12, avgRent1br: 1100, avgRent2br: 1450, avgRent3br: 1900, petFriendly: 1, nightlife: 10, outdoors: 55, familyFriendly: 95, techHub: 45, description: 'Home to Dell HQ and excellent Round Rock ISD schools. Family-friendly with Round Rock Premium Outlets, Old Settlers Park, and affordable living.' },
  { name: 'Zilker', area: 'South', lat: 30.2665, lng: -97.7730, vibe: 'Outdoors,Active,Premium', walkScore: 60, transitScore: 35, avgRent1br: 1750, avgRent2br: 2500, avgRent3br: 3200, petFriendly: 1, nightlife: 40, outdoors: 98, familyFriendly: 70, techHub: 45, description: 'Adjacent to Zilker Park, Barton Springs Pool, and the hike-and-bike trail. Outdoor paradise with easy downtown access. Home of ACL Festival.' },
  { name: 'Barton Hills', area: 'South', lat: 30.2550, lng: -97.7750, vibe: 'Nature,Quiet,Established', walkScore: 45, transitScore: 25, avgRent1br: 1500, avgRent2br: 2200, avgRent3br: 2900, petFriendly: 1, nightlife: 15, outdoors: 95, familyFriendly: 75, techHub: 30, description: 'Tucked into the hills south of Barton Creek with access to the Greenbelt, swimming holes, and nature trails. Quiet and established neighborhood.' },
  { name: 'Travis Heights', area: 'South', lat: 30.2470, lng: -97.7410, vibe: 'Historic,Walkable,Hip', walkScore: 72, transitScore: 40, avgRent1br: 1550, avgRent2br: 2250, avgRent3br: 2900, petFriendly: 1, nightlife: 55, outdoors: 70, familyFriendly: 60, techHub: 45, description: 'Charming hillside neighborhood with historic homes, close to SoCo, and beautiful views of downtown. Walkable to restaurants and shops on South 1st.' },
  { name: 'Clarksville', area: 'Central', lat: 30.2800, lng: -97.7580, vibe: 'Historic,Upscale,Central', walkScore: 80, transitScore: 50, avgRent1br: 1800, avgRent2br: 2600, avgRent3br: 3300, petFriendly: 1, nightlife: 50, outdoors: 50, familyFriendly: 55, techHub: 50, description: 'One of Austin\'s oldest neighborhoods, now upscale with boutiques and restaurants on West Lynn. Walking distance to downtown and Lady Bird Lake.' },
  { name: 'Rainey Street', area: 'Central', lat: 30.2580, lng: -97.7380, vibe: 'Nightlife,Social,Urban', walkScore: 90, transitScore: 65, avgRent1br: 1900, avgRent2br: 2700, avgRent3br: 3500, petFriendly: 0, nightlife: 98, outdoors: 35, familyFriendly: 10, techHub: 70, description: 'Former residential street turned into Austin\'s hottest bar district with bungalow bars and high-rise condos. Steps from Lady Bird Lake.' },
  { name: 'West Campus', area: 'Central', lat: 30.2870, lng: -97.7440, vibe: 'Student,Budget,Social', walkScore: 85, transitScore: 55, avgRent1br: 1100, avgRent2br: 1600, avgRent3br: 2100, petFriendly: 0, nightlife: 70, outdoors: 25, familyFriendly: 5, techHub: 40, description: 'UT Austin\'s backyard with student-oriented apartments, affordable rents, and lively nightlife on the Drag and Guadalupe Street.' },
  { name: 'Brentwood', area: 'Central', lat: 30.3250, lng: -97.7350, vibe: 'Residential,Quiet,Central', walkScore: 62, transitScore: 35, avgRent1br: 1300, avgRent2br: 1900, avgRent3br: 2500, petFriendly: 1, nightlife: 20, outdoors: 55, familyFriendly: 80, techHub: 35, description: 'Quiet central neighborhood with mid-century homes, close to North Loop shops and restaurants. Good balance of affordability and location.' },
  { name: 'Crestview', area: 'North Central', lat: 30.3380, lng: -97.7270, vibe: 'Neighborhood,Chill,Local', walkScore: 58, transitScore: 32, avgRent1br: 1250, avgRent2br: 1800, avgRent3br: 2350, petFriendly: 1, nightlife: 25, outdoors: 50, familyFriendly: 80, techHub: 30, description: 'Residential neighborhood with the Crestview Station MetroRail stop, Little Deli pizza, and a community garden. Quiet but connected.' },
  { name: 'St. Elmo', area: 'South', lat: 30.2280, lng: -97.7680, vibe: 'Industrial,Breweries,Emerging', walkScore: 50, transitScore: 22, avgRent1br: 1200, avgRent2br: 1700, avgRent3br: 2200, petFriendly: 1, nightlife: 45, outdoors: 40, familyFriendly: 35, techHub: 40, description: 'Up-and-coming area south of Ben White with breweries (St. Elmo Brewing), distilleries, and new mixed-use development. Good value.' },
  { name: 'South Lamar', area: 'South', lat: 30.2450, lng: -97.7700, vibe: 'Foodie,Central,Active', walkScore: 68, transitScore: 38, avgRent1br: 1500, avgRent2br: 2150, avgRent3br: 2800, petFriendly: 1, nightlife: 60, outdoors: 65, familyFriendly: 50, techHub: 45, description: 'Restaurant row with Alamo Drafthouse, tons of dining options, and easy access to Barton Creek Greenbelt. Great central location.' },
];

const PROPERTIES = [
  // Downtown
  { neighborhoodName: 'Downtown', name: 'The Independent', address: '1001 W 5th St', beds: 1, rent: 2100, petPolicy: 'Dogs & Cats OK (breed restrictions)', amenities: 'Rooftop pool,Fitness center,Concierge,Dog park', phone: '(512) 555-0101', website: 'https://example.com' },
  { neighborhoodName: 'Downtown', name: 'Saltillo Lofts', address: '900 E 5th St', beds: 2, rent: 2800, petPolicy: 'Dogs & Cats OK', amenities: 'Pool,Gym,Co-working space,Garage parking', phone: '(512) 555-0102', website: 'https://example.com' },
  // East Austin
  { neighborhoodName: 'East Austin', name: 'Corazon Apartments', address: '1105 E 6th St', beds: 1, rent: 1400, petPolicy: 'Dogs & Cats OK', amenities: 'Pool,Community garden,Bike storage,Patio', phone: '(512) 555-0201', website: 'https://example.com' },
  { neighborhoodName: 'East Austin', name: 'East Village Residences', address: '2301 E Cesar Chavez St', beds: 2, rent: 2050, petPolicy: 'Dogs OK under 50lbs', amenities: 'Rooftop deck,Gym,Dog wash,Package lockers', phone: '(512) 555-0202', website: 'https://example.com' },
  { neighborhoodName: 'East Austin', name: 'Govalle Flats', address: '4800 E 7th St', beds: 3, rent: 2650, petPolicy: 'Dogs & Cats OK', amenities: 'Yard,Garage,Washer/Dryer,Covered porch', phone: '(512) 555-0203', website: 'https://example.com' },
  // South Congress
  { neighborhoodName: 'South Congress (SoCo)', name: 'SoCo Flats', address: '2020 S Congress Ave', beds: 1, rent: 1700, petPolicy: 'Dogs & Cats OK', amenities: 'Pool,Fitness center,Courtyard,Walk to SoCo', phone: '(512) 555-0301', website: 'https://example.com' },
  { neighborhoodName: 'South Congress (SoCo)', name: 'Congress Park Place', address: '1800 S Congress Ave', beds: 2, rent: 2350, petPolicy: 'Dogs OK under 40lbs', amenities: 'Gym,Covered parking,Patio,BBQ area', phone: '(512) 555-0302', website: 'https://example.com' },
  // Hyde Park
  { neighborhoodName: 'Hyde Park', name: 'Avenue B Apartments', address: '4200 Avenue B', beds: 1, rent: 1200, petPolicy: 'Cats only', amenities: 'Laundry,Tree-lined street,Near UT shuttle', phone: '(512) 555-0401', website: 'https://example.com' },
  { neighborhoodName: 'Hyde Park', name: 'Speedway Commons', address: '4500 Speedway', beds: 2, rent: 1800, petPolicy: 'Dogs & Cats OK', amenities: 'Courtyard,Bike rack,Washer/Dryer,Near Shipe Park', phone: '(512) 555-0402', website: 'https://example.com' },
  // Mueller
  { neighborhoodName: 'Mueller', name: 'Mosaic at Mueller', address: '1900 Simond Ave', beds: 2, rent: 2000, petPolicy: 'Dogs & Cats OK', amenities: 'Pool,Dog park,Playground,Near Thinkery', phone: '(512) 555-0501', website: 'https://example.com' },
  { neighborhoodName: 'Mueller', name: 'Aldrich 51', address: '5100 Mueller Blvd', beds: 3, rent: 2700, petPolicy: 'Dogs & Cats OK', amenities: 'Pool,Fitness center,Garage,Community events', phone: '(512) 555-0502', website: 'https://example.com' },
  // The Domain
  { neighborhoodName: 'The Domain', name: 'AMLI Domain', address: '11101 Domain Dr', beds: 1, rent: 1600, petPolicy: 'Dogs & Cats OK (breed restrictions)', amenities: 'Resort pool,Sky lounge,Fitness center,Pet spa', phone: '(512) 555-0601', website: 'https://example.com' },
  { neighborhoodName: 'The Domain', name: 'Windsor at Domain', address: '11800 Domain Blvd', beds: 2, rent: 2350, petPolicy: 'Dogs & Cats OK', amenities: 'Pool,Gym,Game room,Near Apple campus', phone: '(512) 555-0602', website: 'https://example.com' },
  // Cedar Park
  { neighborhoodName: 'Cedar Park', name: 'Lakeline Oaks', address: '12400 N Lakeline Blvd', beds: 2, rent: 1500, petPolicy: 'Dogs & Cats OK', amenities: 'Pool,Playground,Covered parking,Dog park', phone: '(512) 555-0701', website: 'https://example.com' },
  { neighborhoodName: 'Cedar Park', name: 'Bell Cedar Park', address: '1400 E Whitestone Blvd', beds: 3, rent: 1950, petPolicy: 'Dogs & Cats OK', amenities: 'Pool,Fitness center,Garage,Near 183A', phone: '(512) 555-0702', website: 'https://example.com' },
  // Round Rock
  { neighborhoodName: 'Round Rock', name: 'Palomino Crossing', address: '3100 S A.W. Grimes Blvd', beds: 2, rent: 1400, petPolicy: 'Dogs & Cats OK', amenities: 'Pool,Gym,Playground,Near Dell HQ', phone: '(512) 555-0801', website: 'https://example.com' },
  { neighborhoodName: 'Round Rock', name: 'Settlers Creek', address: '2700 N Mays St', beds: 3, rent: 1850, petPolicy: 'Dogs & Cats OK', amenities: 'Pool,Dog park,Covered parking,Near Old Settlers Park', phone: '(512) 555-0802', website: 'https://example.com' },
  // Zilker
  { neighborhoodName: 'Zilker', name: 'Barton Creek Landing', address: '2600 Barton Creek Blvd', beds: 1, rent: 1800, petPolicy: 'Dogs OK under 50lbs', amenities: 'Pool,Trail access,Fitness center,Covered parking', phone: '(512) 555-0901', website: 'https://example.com' },
  { neighborhoodName: 'Zilker', name: 'Zilker Park Residences', address: '1900 Toomey Rd', beds: 2, rent: 2500, petPolicy: 'Dogs & Cats OK', amenities: 'Pool,Near Barton Springs,Gym,Views', phone: '(512) 555-0902', website: 'https://example.com' },
  // Barton Hills
  { neighborhoodName: 'Barton Hills', name: 'Barton Hills Plaza', address: '2500 S Lamar Blvd', beds: 1, rent: 1450, petPolicy: 'Dogs & Cats OK', amenities: 'Pool,Near Greenbelt,Laundry,Covered parking', phone: '(512) 555-1001', website: 'https://example.com' },
  // Travis Heights
  { neighborhoodName: 'Travis Heights', name: 'Travis Heights Terrace', address: '1200 Travis Heights Blvd', beds: 1, rent: 1500, petPolicy: 'Dogs & Cats OK', amenities: 'Pool,Views,Courtyard,Walk to SoCo', phone: '(512) 555-1101', website: 'https://example.com' },
  { neighborhoodName: 'Travis Heights', name: 'South Shore Flats', address: '1400 S IH-35', beds: 2, rent: 2200, petPolicy: 'Dogs OK under 40lbs', amenities: 'Lake views,Pool,Gym,Concierge', phone: '(512) 555-1102', website: 'https://example.com' },
  // Clarksville
  { neighborhoodName: 'Clarksville', name: 'West Lynn Place', address: '1100 W Lynn St', beds: 1, rent: 1750, petPolicy: 'Dogs & Cats OK', amenities: 'Courtyard,Walk to downtown,Historic area,Laundry', phone: '(512) 555-1201', website: 'https://example.com' },
  // Rainey Street
  { neighborhoodName: 'Rainey Street', name: 'The Quincy', address: '80 Rainey St', beds: 1, rent: 2000, petPolicy: 'No pets', amenities: 'Rooftop pool,Sky lounge,Gym,Concierge', phone: '(512) 555-1301', website: 'https://example.com' },
  { neighborhoodName: 'Rainey Street', name: '44 East', address: '44 East Ave', beds: 2, rent: 2800, petPolicy: 'Dogs OK under 25lbs', amenities: 'Infinity pool,Fitness center,Valet,Lake views', phone: '(512) 555-1302', website: 'https://example.com' },
  // West Campus
  { neighborhoodName: 'West Campus', name: 'Callaway House', address: '501 W 26th St', beds: 1, rent: 1050, petPolicy: 'No pets', amenities: 'Study rooms,Pool,Gym,Near UT', phone: '(512) 555-1401', website: 'https://example.com' },
  { neighborhoodName: 'West Campus', name: '26 West', address: '2600 Rio Grande St', beds: 2, rent: 1550, petPolicy: 'No pets', amenities: 'Pool,Fitness,Game room,UT shuttle', phone: '(512) 555-1402', website: 'https://example.com' },
  // Brentwood
  { neighborhoodName: 'Brentwood', name: 'North Loop Lofts', address: '5200 North Lamar Blvd', beds: 1, rent: 1300, petPolicy: 'Dogs & Cats OK', amenities: 'Courtyard,Near North Loop,Bike-friendly', phone: '(512) 555-1501', website: 'https://example.com' },
  // Crestview
  { neighborhoodName: 'Crestview', name: 'Crestview Station Apartments', address: '6400 N Lamar Blvd', beds: 2, rent: 1750, petPolicy: 'Dogs & Cats OK', amenities: 'Near MetroRail,Pool,Dog park,Patio', phone: '(512) 555-1601', website: 'https://example.com' },
  // St. Elmo
  { neighborhoodName: 'St. Elmo', name: 'St. Elmo Lofts', address: '4700 E St Elmo Rd', beds: 1, rent: 1150, petPolicy: 'Dogs & Cats OK', amenities: 'Near breweries,Patio,Modern finishes,Parking', phone: '(512) 555-1701', website: 'https://example.com' },
  { neighborhoodName: 'St. Elmo', name: 'South Side Studios', address: '5000 E St Elmo Rd', beds: 2, rent: 1650, petPolicy: 'Dogs OK', amenities: 'Pool,Gym,Dog wash,Near South Park Meadows', phone: '(512) 555-1702', website: 'https://example.com' },
  // South Lamar
  { neighborhoodName: 'South Lamar', name: 'Lamar Union Living', address: '1100 S Lamar Blvd', beds: 1, rent: 1550, petPolicy: 'Dogs & Cats OK', amenities: 'Pool,Near Alamo Drafthouse,Fitness,Garage', phone: '(512) 555-1801', website: 'https://example.com' },
  { neighborhoodName: 'South Lamar', name: 'Southside Flats', address: '2200 S Lamar Blvd', beds: 2, rent: 2100, petPolicy: 'Dogs OK under 50lbs', amenities: 'Pool,Near Greenbelt,Gym,Co-working', phone: '(512) 555-1802', website: 'https://example.com' },
];

export async function initDB() {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: (file) => `https://sql.js.org/dist/${file}`,
  });

  db = new SQL.Database();

  db.run(`
    CREATE TABLE neighborhoods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      area TEXT,
      lat REAL,
      lng REAL,
      vibe TEXT,
      walkScore INTEGER,
      transitScore INTEGER,
      avgRent1br INTEGER,
      avgRent2br INTEGER,
      avgRent3br INTEGER,
      petFriendly INTEGER,
      nightlife INTEGER,
      outdoors INTEGER,
      familyFriendly INTEGER,
      techHub INTEGER,
      description TEXT
    )
  `);

  db.run(`
    CREATE TABLE properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      neighborhoodId INTEGER,
      name TEXT NOT NULL,
      address TEXT,
      beds INTEGER,
      rent INTEGER,
      petPolicy TEXT,
      amenities TEXT,
      phone TEXT,
      email TEXT,
      website TEXT,
      FOREIGN KEY (neighborhoodId) REFERENCES neighborhoods(id)
    )
  `);

  for (const n of NEIGHBORHOODS) {
    db.run(
      `INSERT INTO neighborhoods (name, area, lat, lng, vibe, walkScore, transitScore, avgRent1br, avgRent2br, avgRent3br, petFriendly, nightlife, outdoors, familyFriendly, techHub, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [n.name, n.area, n.lat, n.lng, n.vibe, n.walkScore, n.transitScore, n.avgRent1br, n.avgRent2br, n.avgRent3br, n.petFriendly, n.nightlife, n.outdoors, n.familyFriendly, n.techHub, n.description]
    );
  }

  const neighborhoodIds = {};
  const rows = db.exec('SELECT id, name FROM neighborhoods');
  if (rows.length > 0) {
    for (const row of rows[0].values) {
      neighborhoodIds[row[1]] = row[0];
    }
  }

  for (const p of PROPERTIES) {
    const nId = neighborhoodIds[p.neighborhoodName];
    if (nId) {
      db.run(
        `INSERT INTO properties (neighborhoodId, name, address, beds, rent, petPolicy, amenities, phone, email, website)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nId, p.name, p.address, p.beds, p.rent, p.petPolicy, p.amenities, p.phone, p.email || null, p.website]
      );
    }
  }

  return db;
}

export function queryNeighborhoods(filters = {}) {
  if (!db) return [];

  let sql = 'SELECT * FROM neighborhoods WHERE 1=1';
  const params = [];

  if (filters.maxRent) {
    sql += ' AND avgRent1br <= ?';
    params.push(filters.maxRent);
  }
  if (filters.petFriendly) {
    sql += ' AND petFriendly = 1';
  }
  if (filters.area) {
    sql += ' AND area = ?';
    params.push(filters.area);
  }
  if (filters.minWalkScore) {
    sql += ' AND walkScore >= ?';
    params.push(filters.minWalkScore);
  }

  const result = db.exec(sql, params);
  if (result.length === 0) return [];

  return result[0].values.map((row) => {
    const cols = result[0].columns;
    const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

export function queryProperties(neighborhoodId) {
  if (!db) return [];

  const result = db.exec(
    'SELECT * FROM properties WHERE neighborhoodId = ?',
    [neighborhoodId]
  );
  if (result.length === 0) return [];

  return result[0].values.map((row) => {
    const cols = result[0].columns;
    const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

export function queryAllProperties() {
  if (!db) return [];
  const result = db.exec('SELECT * FROM properties');
  if (result.length === 0) return [];
  return result[0].values.map((row) => {
    const cols = result[0].columns;
    const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

export function getNeighborhoodByName(name) {
  if (!db) return null;
  const result = db.exec(
    'SELECT * FROM neighborhoods WHERE LOWER(name) LIKE ?',
    [`%${name.toLowerCase()}%`]
  );
  if (result.length === 0 || result[0].values.length === 0) return null;
  const cols = result[0].columns;
  const obj = {};
  cols.forEach((col, i) => { obj[col] = result[0].values[0][i]; });
  return obj;
}

export function getNeighborhoodStats() {
  if (!db) return null;
  const result = db.exec(`
    SELECT
      COUNT(*) as total,
      MIN(avgRent1br) as minRent,
      MAX(avgRent1br) as maxRent,
      AVG(avgRent1br) as avgRent,
      AVG(walkScore) as avgWalk
    FROM neighborhoods
  `);
  if (result.length === 0) return null;
  const cols = result[0].columns;
  const obj = {};
  cols.forEach((col, i) => { obj[col] = result[0].values[0][i]; });
  return obj;
}

export function getAllNeighborhoods() {
  return queryNeighborhoods();
}
