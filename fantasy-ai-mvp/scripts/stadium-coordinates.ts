/**
 * 🏟️ STADIUM COORDINATES
 * Precise GPS coordinates for all major sports stadiums
 * Used for accurate game-time weather data with OpenWeather API 3.0
 */

export const STADIUM_COORDINATES = {
  NFL: [
    // AFC East
    { team: 'Bills', stadium: 'Highmark Stadium', city: 'Buffalo', state: 'NY', lat: 42.7738, lon: -78.7870, outdoor: true },
    { team: 'Dolphins', stadium: 'Hard Rock Stadium', city: 'Miami Gardens', state: 'FL', lat: 25.9580, lon: -80.2389, outdoor: true },
    { team: 'Patriots', stadium: 'Gillette Stadium', city: 'Foxborough', state: 'MA', lat: 42.0909, lon: -71.2644, outdoor: true },
    { team: 'Jets', stadium: 'MetLife Stadium', city: 'East Rutherford', state: 'NJ', lat: 40.8136, lon: -74.0745, outdoor: true },
    
    // AFC North
    { team: 'Ravens', stadium: 'M&T Bank Stadium', city: 'Baltimore', state: 'MD', lat: 39.2780, lon: -76.6227, outdoor: true },
    { team: 'Bengals', stadium: 'Paycor Stadium', city: 'Cincinnati', state: 'OH', lat: 39.0954, lon: -84.5161, outdoor: true },
    { team: 'Browns', stadium: 'Cleveland Browns Stadium', city: 'Cleveland', state: 'OH', lat: 41.5061, lon: -81.6995, outdoor: true },
    { team: 'Steelers', stadium: 'Acrisure Stadium', city: 'Pittsburgh', state: 'PA', lat: 40.4468, lon: -80.0158, outdoor: true },
    
    // AFC South
    { team: 'Texans', stadium: 'NRG Stadium', city: 'Houston', state: 'TX', lat: 29.6847, lon: -95.4107, outdoor: false },
    { team: 'Colts', stadium: 'Lucas Oil Stadium', city: 'Indianapolis', state: 'IN', lat: 39.7601, lon: -86.1639, outdoor: false },
    { team: 'Jaguars', stadium: 'TIAA Bank Field', city: 'Jacksonville', state: 'FL', lat: 30.3239, lon: -81.6373, outdoor: true },
    { team: 'Titans', stadium: 'Nissan Stadium', city: 'Nashville', state: 'TN', lat: 36.1665, lon: -86.7713, outdoor: true },
    
    // AFC West
    { team: 'Broncos', stadium: 'Empower Field', city: 'Denver', state: 'CO', lat: 39.7439, lon: -105.0201, outdoor: true },
    { team: 'Chiefs', stadium: 'Arrowhead Stadium', city: 'Kansas City', state: 'MO', lat: 39.0489, lon: -94.4839, outdoor: true },
    { team: 'Raiders', stadium: 'Allegiant Stadium', city: 'Las Vegas', state: 'NV', lat: 36.0909, lon: -115.1833, outdoor: false },
    { team: 'Chargers', stadium: 'SoFi Stadium', city: 'Inglewood', state: 'CA', lat: 33.9535, lon: -118.3392, outdoor: false },
    
    // NFC East
    { team: 'Cowboys', stadium: 'AT&T Stadium', city: 'Arlington', state: 'TX', lat: 32.7473, lon: -97.0945, outdoor: false },
    { team: 'Giants', stadium: 'MetLife Stadium', city: 'East Rutherford', state: 'NJ', lat: 40.8136, lon: -74.0745, outdoor: true },
    { team: 'Eagles', stadium: 'Lincoln Financial Field', city: 'Philadelphia', state: 'PA', lat: 39.9012, lon: -75.1675, outdoor: true },
    { team: 'Commanders', stadium: 'FedExField', city: 'Landover', state: 'MD', lat: 38.9076, lon: -76.8645, outdoor: true },
    
    // NFC North
    { team: 'Bears', stadium: 'Soldier Field', city: 'Chicago', state: 'IL', lat: 41.8623, lon: -87.6167, outdoor: true },
    { team: 'Lions', stadium: 'Ford Field', city: 'Detroit', state: 'MI', lat: 42.3400, lon: -83.0456, outdoor: false },
    { team: 'Packers', stadium: 'Lambeau Field', city: 'Green Bay', state: 'WI', lat: 44.5013, lon: -88.0622, outdoor: true },
    { team: 'Vikings', stadium: 'U.S. Bank Stadium', city: 'Minneapolis', state: 'MN', lat: 44.9738, lon: -93.2575, outdoor: false },
    
    // NFC South
    { team: 'Falcons', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta', state: 'GA', lat: 33.7553, lon: -84.4006, outdoor: false },
    { team: 'Panthers', stadium: 'Bank of America Stadium', city: 'Charlotte', state: 'NC', lat: 35.2258, lon: -80.8528, outdoor: true },
    { team: 'Saints', stadium: 'Caesars Superdome', city: 'New Orleans', state: 'LA', lat: 29.9511, lon: -90.0812, outdoor: false },
    { team: 'Buccaneers', stadium: 'Raymond James Stadium', city: 'Tampa', state: 'FL', lat: 27.9759, lon: -82.5033, outdoor: true },
    
    // NFC West
    { team: '49ers', stadium: 'Levis Stadium', city: 'Santa Clara', state: 'CA', lat: 37.4033, lon: -121.9694, outdoor: true },
    { team: 'Cardinals', stadium: 'State Farm Stadium', city: 'Glendale', state: 'AZ', lat: 33.5276, lon: -112.2626, outdoor: false },
    { team: 'Rams', stadium: 'SoFi Stadium', city: 'Inglewood', state: 'CA', lat: 33.9535, lon: -118.3392, outdoor: false },
    { team: 'Seahawks', stadium: 'Lumen Field', city: 'Seattle', state: 'WA', lat: 47.5952, lon: -122.3316, outdoor: true }
  ],
  
  NBA: [
    // Sample of major arenas (all indoor, weather less critical)
    { team: 'Lakers', arena: 'Crypto.com Arena', city: 'Los Angeles', state: 'CA', lat: 34.0430, lon: -118.2673 },
    { team: 'Celtics', arena: 'TD Garden', city: 'Boston', state: 'MA', lat: 42.3662, lon: -71.0621 },
    { team: 'Warriors', arena: 'Chase Center', city: 'San Francisco', state: 'CA', lat: 37.7680, lon: -122.3879 },
    { team: 'Heat', arena: 'FTX Arena', city: 'Miami', state: 'FL', lat: 25.7814, lon: -80.1870 },
    { team: 'Bucks', arena: 'Fiserv Forum', city: 'Milwaukee', state: 'WI', lat: 43.0451, lon: -87.9173 }
  ],
  
  MLB: [
    // Key outdoor stadiums where weather matters most
    { team: 'Yankees', stadium: 'Yankee Stadium', city: 'Bronx', state: 'NY', lat: 40.8296, lon: -73.9262, outdoor: true },
    { team: 'Red Sox', stadium: 'Fenway Park', city: 'Boston', state: 'MA', lat: 42.3467, lon: -71.0972, outdoor: true },
    { team: 'Dodgers', stadium: 'Dodger Stadium', city: 'Los Angeles', state: 'CA', lat: 34.0739, lon: -118.2400, outdoor: true },
    { team: 'Cubs', stadium: 'Wrigley Field', city: 'Chicago', state: 'IL', lat: 41.9484, lon: -87.6553, outdoor: true },
    { team: 'Giants', stadium: 'Oracle Park', city: 'San Francisco', state: 'CA', lat: 37.7786, lon: -122.3893, outdoor: true }
  ],
  
  NHL: [
    // All indoor, but useful for travel/city weather
    { team: 'Rangers', arena: 'Madison Square Garden', city: 'New York', state: 'NY', lat: 40.7505, lon: -73.9934 },
    { team: 'Maple Leafs', arena: 'Scotiabank Arena', city: 'Toronto', state: 'ON', lat: 43.6435, lon: -79.3791 },
    { team: 'Canadiens', arena: 'Bell Centre', city: 'Montreal', state: 'QC', lat: 45.4961, lon: -73.5693 }
  ]
};

// Helper function to get weather-critical stadiums (outdoor only)
export function getOutdoorStadiums(sport: 'NFL' | 'MLB' = 'NFL') {
  if (sport === 'NFL') {
    return STADIUM_COORDINATES.NFL.filter(s => s.outdoor);
  } else if (sport === 'MLB') {
    return STADIUM_COORDINATES.MLB.filter(s => s.outdoor);
  }
  return [];
}

// Get stadium by team name
export function getStadiumByTeam(teamName: string) {
  const allStadiums = [
    ...STADIUM_COORDINATES.NFL,
    ...STADIUM_COORDINATES.NBA,
    ...STADIUM_COORDINATES.MLB,
    ...STADIUM_COORDINATES.NHL
  ];
  
  return allStadiums.find(s => 
    s.team.toLowerCase() === teamName.toLowerCase() ||
    s.team.toLowerCase().includes(teamName.toLowerCase())
  );
}

// Get weather impact factor based on conditions
export function getWeatherImpact(weather: {
  windSpeed?: number;
  temperature?: number;
  precipitation?: number;
  description?: string;
}) {
  let impact = 1.0; // No impact
  
  // Wind impact (affects passing game)
  if (weather.windSpeed) {
    if (weather.windSpeed > 20) impact *= 0.85; // High wind
    else if (weather.windSpeed > 15) impact *= 0.92; // Moderate wind
  }
  
  // Temperature impact
  if (weather.temperature) {
    if (weather.temperature < 32) impact *= 0.95; // Freezing
    else if (weather.temperature < 40) impact *= 0.97; // Cold
    else if (weather.temperature > 90) impact *= 0.96; // Very hot
  }
  
  // Precipitation impact
  if (weather.description) {
    if (weather.description.includes('rain')) impact *= 0.90;
    if (weather.description.includes('snow')) impact *= 0.85;
    if (weather.description.includes('storm')) impact *= 0.80;
  }
  
  return impact;
}