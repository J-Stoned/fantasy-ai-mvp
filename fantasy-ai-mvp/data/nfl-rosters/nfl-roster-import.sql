
-- NFL Roster Database Schema and Data
-- Generated: 2025-06-22T02:27:59.896Z
-- Total Players: 715
-- Total Teams: undefined


CREATE TABLE IF NOT EXISTS nfl_teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(5) NOT NULL UNIQUE,
    division VARCHAR(20) NOT NULL,
    conference VARCHAR(5) NOT NULL,
    player_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE IF NOT EXISTS nfl_players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(10) NOT NULL,
    jersey_number INTEGER,
    height VARCHAR(10),
    weight INTEGER,
    age INTEGER,
    experience VARCHAR(20),
    college VARCHAR(255),
    team_name VARCHAR(255) NOT NULL,
    team_abbreviation VARCHAR(5) NOT NULL,
    division VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    source VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_players_team ON nfl_players(team_abbreviation);
CREATE INDEX IF NOT EXISTS idx_players_position ON nfl_players(position);
CREATE INDEX IF NOT EXISTS idx_players_name ON nfl_players(name);


-- Insert team data
INSERT INTO nfl_teams (name, abbreviation, division, conference, player_count) VALUES
('New England Patriots', 'NE', 'AFC East', 'AFC', 75),
('Buffalo Bills', 'BUF', 'AFC East', 'AFC', 85),
('Kansas City Chiefs', 'KC', 'AFC West', 'AFC', 90),
('Green Bay Packers', 'GB', 'NFC North', 'NFC', 88),
('Dallas Cowboys', 'DAL', 'NFC East', 'NFC', 92),
('San Francisco 49ers', 'SF', 'NFC West', 'NFC', 80),
('Pittsburgh Steelers', 'PIT', 'AFC North', 'AFC', 85),
('Philadelphia Eagles', 'PHI', 'NFC East', 'NFC', 87),
('Baltimore Ravens', 'BAL', 'AFC North', 'AFC', 89),
('New York Giants', 'NYG', 'NFC East', 'NFC', 86);

-- Insert player data
INSERT INTO nfl_players (name, position, jersey_number, height, weight, age, experience, college, team_name, team_abbreviation, division, status, source) VALUES
('Joshua Dobbs', 'QB', 11, '6'3"', 220, 30, '9 years', 'Tennessee', 'New England Patriots', 'NE', 'AFC East', 'active', 'ESPN'),
('Drake Maye', 'QB', 10, '6'4"', 225, 22, '2 years', 'North Carolina', 'New England Patriots', 'NE', 'AFC East', 'active', 'ESPN'),
('Ben Wooldridge', 'QB', 17, '6'2"', 214, NULL, 'Rookie', 'Louisiana', 'New England Patriots', 'NE', 'AFC East', 'active', 'ESPN'),
('Antonio Gibson', 'RB', 4, '6'0"', 228, 26, '6 years', 'Memphis', 'New England Patriots', 'NE', 'AFC East', 'active', 'ESPN'),
('TreVeyon Henderson', 'RB', 32, '5'10"', 202, 22, 'Rookie', 'Ohio State', 'New England Patriots', 'NE', 'AFC East', 'active', 'ESPN'),
('Stefon Diggs', 'WR', 8, '6'0"', 191, 31, '11 years', 'Maryland', 'New England Patriots', 'NE', 'AFC East', 'active', 'ESPN'),
('Kendrick Bourne', 'WR', 84, '6'1"', 190, 29, '8 years', 'Eastern Washington', 'New England Patriots', 'NE', 'AFC East', 'active', 'ESPN'),
('Kayshon Boutte', 'WR', 9, '6'0"', 190, 22, '2 years', 'LSU', 'New England Patriots', 'NE', 'AFC East', 'active', 'ESPN'),
('Hunter Henry', 'TE', 85, '6'5"', 250, 30, '9 years', 'Arkansas', 'New England Patriots', 'NE', 'AFC East', 'active', 'ESPN'),
('Morgan Moses', 'OT', 76, '6'6"', 335, 34, '12 years', 'Virginia', 'New England Patriots', 'NE', 'AFC East', 'active', 'ESPN'),
('Josh Allen', 'QB', 17, '6'5"', 237, 29, '8 years', 'Wyoming', 'Buffalo Bills', 'BUF', 'AFC East', 'active', 'ESPN'),
('Shane Buechele', 'QB', 6, '6'0"', 210, 27, '4 years', 'SMU', 'Buffalo Bills', 'BUF', 'AFC East', 'active', 'ESPN'),
('Mitchell Trubisky', 'QB', 11, '6'3"', 222, 30, '9 years', 'North Carolina', 'Buffalo Bills', 'BUF', 'AFC East', 'active', 'ESPN'),
('Mike White', 'QB', 14, '6'5"', 220, 30, '6 years', 'Western Kentucky', 'Buffalo Bills', 'BUF', 'AFC East', 'active', 'ESPN'),
('James Cook', 'RB', 4, '5'11"', 190, 25, '4 years', 'Georgia', 'Buffalo Bills', 'BUF', 'AFC East', 'active', 'ESPN'),
('Ray Davis', 'RB', 22, '5'8"', 220, 25, '2 years', 'Kentucky', 'Buffalo Bills', 'BUF', 'AFC East', 'active', 'ESPN'),
('Darrynton Evans', 'RB', 21, '5'10"', 203, 26, '6 years', 'App State', 'Buffalo Bills', 'BUF', 'AFC East', 'active', 'ESPN'),
('Frank Gore Jr.', 'RB', 20, '5'8"', 195, 23, '1 year', 'Southern Miss', 'Buffalo Bills', 'BUF', 'AFC East', 'active', 'ESPN'),
('Ty Johnson', 'RB', 26, '5'10"', 210, 27, '7 years', 'Maryland', 'Buffalo Bills', 'BUF', 'AFC East', 'active', 'ESPN'),
('Patrick Mahomes', 'QB', 15, '6'2"', 225, 29, '9 years', 'Texas Tech', 'Kansas City Chiefs', 'KC', 'AFC West', 'active', 'ESPN'),
('Gardner Minshew', 'QB', 17, '6'1"', 225, 29, '7 years', 'Washington State', 'Kansas City Chiefs', 'KC', 'AFC West', 'active', 'ESPN'),
('Chris Oladokun', 'QB', 19, '6'1"', 213, 27, '1 year', 'South Dakota State', 'Kansas City Chiefs', 'KC', 'AFC West', 'active', 'ESPN'),
('Bailey Zappe', 'QB', 14, '6'1"', 215, 26, '4 years', 'Western Kentucky', 'Kansas City Chiefs', 'KC', 'AFC West', 'active', 'ESPN'),
('Kareem Hunt', 'RB', 29, '5'11"', 216, 29, '9 years', 'Toledo', 'Kansas City Chiefs', 'KC', 'AFC West', 'active', 'ESPN'),
('Elijah Mitchell', 'RB', 25, '5'10"', 200, 27, '5 years', 'Louisiana', 'Kansas City Chiefs', 'KC', 'AFC West', 'active', 'ESPN'),
('Isiah Pacheco', 'RB', 10, '5'10"', 216, 26, '4 years', 'Rutgers', 'Kansas City Chiefs', 'KC', 'AFC West', 'active', 'ESPN'),
('Brashard Smith', 'RB', 30, '5'10"', 196, 22, 'Rookie', 'SMU', 'Kansas City Chiefs', 'KC', 'AFC West', 'active', 'ESPN'),
('Carson Steele', 'RB', 42, '6'0"', 228, 22, '2 years', 'UCLA', 'Kansas City Chiefs', 'KC', 'AFC West', 'active', 'ESPN'),
('Hollywood Brown', 'WR', 5, '5'9"', 180, 28, '7 years', 'Oklahoma', 'Kansas City Chiefs', 'KC', 'AFC West', 'active', 'ESPN'),
('Skyy Moore', 'WR', 24, '5'10"', 195, 24, '4 years', 'Western Michigan', 'Kansas City Chiefs', 'KC', 'AFC West', 'active', 'ESPN'),
('Rashee Rice', 'WR', 4, '6'1"', 204, 25, '3 years', 'SMU', 'Kansas City Chiefs', 'KC', 'AFC West', 'active', 'ESPN'),
('JuJu Smith-Schuster', 'WR', 9, '6'1"', 215, 28, '8 years', 'USC', 'Kansas City Chiefs', 'KC', 'AFC West', 'active', 'ESPN'),
('Jordan Love', 'QB', 10, '6'4"', 219, 26, '6 years', 'Utah State', 'Green Bay Packers', 'GB', 'NFC North', 'active', 'ESPN'),
('Sean Clifford', 'QB', 16, '6'2"', 218, 26, '2 years', 'Penn State', 'Green Bay Packers', 'GB', 'NFC North', 'active', 'ESPN'),
('Malik Willis', 'QB', 2, '6'1"', 225, 26, '4 years', 'Liberty', 'Green Bay Packers', 'GB', 'NFC North', 'active', 'ESPN'),
('Taylor Elgersma', 'QB', 19, '6'5"', 227, NULL, 'Rookie', 'Wilfred Laurier', 'Green Bay Packers', 'GB', 'NFC North', 'active', 'ESPN'),
('Josh Jacobs', 'RB', 8, '5'10"', 223, 27, '7 years', 'Alabama', 'Green Bay Packers', 'GB', 'NFC North', 'active', 'ESPN'),
('MarShawn Lloyd', 'RB', 32, '5'9"', 220, 24, '2 years', 'USC', 'Green Bay Packers', 'GB', 'NFC North', 'active', 'ESPN'),
('Emanuel Wilson', 'RB', 31, '5'10"', 226, 26, '3 years', 'Fort Valley State', 'Green Bay Packers', 'GB', 'NFC North', 'active', 'ESPN'),
('Chris Brooks', 'RB', 30, '6'1"', 219, 25, '3 years', 'BYU', 'Green Bay Packers', 'GB', 'NFC North', 'active', 'ESPN'),
('Dak Prescott', 'QB', 4, '6'2"', 238, 31, '9 years', 'Mississippi State', 'Dallas Cowboys', 'DAL', 'NFC East', 'active', 'ESPN'),
('Will Grier', 'QB', 15, '6'2"', 214, 30, '6 years', 'West Virginia', 'Dallas Cowboys', 'DAL', 'NFC East', 'active', 'ESPN'),
('Joe Milton III', 'QB', 10, '6'5"', 245, 25, '2 years', 'Tennessee', 'Dallas Cowboys', 'DAL', 'NFC East', 'active', 'ESPN'),
('Miles Sanders', 'RB', 27, '5'11"', 211, 28, '6 years', 'Penn State', 'Dallas Cowboys', 'DAL', 'NFC East', 'active', 'ESPN'),
('Javonte Williams', 'RB', 33, '5'10"', 220, 25, '5 years', 'North Carolina', 'Dallas Cowboys', 'DAL', 'NFC East', 'active', 'ESPN'),
('Deuce Vaughn', 'RB', 42, '5'6"', 179, 23, '2 years', 'Kansas State', 'Dallas Cowboys', 'DAL', 'NFC East', 'active', 'ESPN'),
('Jaydon Blue', 'RB', 34, '5'11"', 199, 21, 'Rookie', 'Texas', 'Dallas Cowboys', 'DAL', 'NFC East', 'active', 'ESPN'),
('Hunter Luepke', 'RB', 40, '6'1"', 236, 25, '2 years', 'North Dakota State', 'Dallas Cowboys', 'DAL', 'NFC East', 'active', 'ESPN'),
('Phil Mafah', 'RB', 37, '6'1"', 230, 22, 'Rookie', 'Clemson', 'Dallas Cowboys', 'DAL', 'NFC East', 'active', 'ESPN'),
('CeeDee Lamb', 'WR', 88, '6'2"', 198, 26, '5 years', 'Oklahoma', 'Dallas Cowboys', 'DAL', 'NFC East', 'active', 'ESPN'),
('George Pickens', 'WR', 13, '6'3"', 195, 24, '3 years', 'Georgia', 'Dallas Cowboys', 'DAL', 'NFC East', 'active', 'ESPN'),
('Jalen Tolbert', 'WR', 1, '6'1"', 194, 26, '3 years', 'South Alabama', 'Dallas Cowboys', 'DAL', 'NFC East', 'active', 'ESPN'),
('KaVontae Turpin', 'WR', 9, '5'7"', 153, 28, '3 years', 'TCU', 'Dallas Cowboys', 'DAL', 'NFC East', 'active', 'ESPN'),
('Parris Campbell', 'WR', 80, '6'0"', 205, 27, '6 years', 'Ohio State', 'Dallas Cowboys', 'DAL', 'NFC East', 'active', 'ESPN'),
('Jonathan Mingo', 'WR', 81, '6'2"', 220, 24, '2 years', 'Ole Miss', 'Dallas Cowboys', 'DAL', 'NFC East', 'active', 'ESPN'),
('Jake Ferguson', 'TE', 87, '6'5"', 250, 26, '3 years', 'Wisconsin', 'Dallas Cowboys', 'DAL', 'NFC East', 'active', 'ESPN'),
('Luke Schoonmaker', 'TE', 86, '6'6"', 251, 26, '2 years', 'Michigan', 'Dallas Cowboys', 'DAL', 'NFC East', 'active', 'ESPN'),
('Princeton Fant', 'TE', 85, '6'4"', 244, 26, '5 years', 'Tennessee', 'Dallas Cowboys', 'DAL', 'NFC East', 'active', 'ESPN'),
('Mac Jones', 'QB', 10, '6'3"', 220, 26, '5 years', 'Alabama', 'San Francisco 49ers', 'SF', 'NFC West', 'active', 'ESPN'),
('Tanner Mordecai', 'QB', 14, '6'2"', 218, 25, '1 year', 'Wisconsin', 'San Francisco 49ers', 'SF', 'NFC West', 'active', 'ESPN'),
('Brock Purdy', 'QB', 13, '6'1"', 220, 25, '4 years', 'Iowa State', 'San Francisco 49ers', 'SF', 'NFC West', 'active', 'ESPN'),
('Kurtis Rourke', 'QB', 4, '6'4"', 220, 24, 'Rookie', 'Indiana', 'San Francisco 49ers', 'SF', 'NFC West', 'active', 'ESPN'),
('Christian McCaffrey', 'RB', 23, '5'11"', 210, 29, '9 years', 'Stanford', 'San Francisco 49ers', 'SF', 'NFC West', 'active', 'ESPN'),
('Israel Abanikanda', 'RB', 20, '5'10"', 216, 22, '3 years', 'Pittsburgh', 'San Francisco 49ers', 'SF', 'NFC West', 'active', 'ESPN'),
('Isaac Guerendo', 'RB', 31, '6'0"', 221, 24, '2 years', 'Louisville', 'San Francisco 49ers', 'SF', 'NFC West', 'active', 'ESPN'),
('Patrick Taylor Jr.', 'RB', 32, '6'2"', 217, 27, '5 years', 'Memphis', 'San Francisco 49ers', 'SF', 'NFC West', 'active', 'ESPN'),
('Will Howard', 'QB', 18, '6'4"', 236, 23, 'Rookie', 'Ohio State', 'Pittsburgh Steelers', 'PIT', 'AFC North', 'active', 'ESPN'),
('Aaron Rodgers', 'QB', 8, '6'2"', 223, 41, '21 years', 'California', 'Pittsburgh Steelers', 'PIT', 'AFC North', 'active', 'ESPN'),
('Mason Rudolph', 'QB', 2, '6'5"', 235, 29, '8 years', 'Oklahoma State', 'Pittsburgh Steelers', 'PIT', 'AFC North', 'active', 'ESPN'),
('Skylar Thompson', 'QB', 17, '6'2"', 219, 28, '4 years', 'Kansas State', 'Pittsburgh Steelers', 'PIT', 'AFC North', 'active', 'ESPN'),
('Kenneth Gainwell', 'RB', 14, '5'9"', 200, 26, '5 years', 'Memphis', 'Pittsburgh Steelers', 'PIT', 'AFC North', 'active', 'ESPN'),
('Evan Hull', 'RB', 38, '5'10"', 209, 24, '2 years', 'Northwestern', 'Pittsburgh Steelers', 'PIT', 'AFC North', 'active', 'ESPN'),
('Kaleb Johnson', 'RB', 20, '6'1"', 224, 21, 'Rookie', 'Iowa', 'Pittsburgh Steelers', 'PIT', 'AFC North', 'active', 'ESPN'),
('Cordarrelle Patterson', 'RB', 84, '6'2"', 220, 34, '13 years', 'Tennessee', 'Pittsburgh Steelers', 'PIT', 'AFC North', 'active', 'ESPN'),
('Trey Sermon', 'RB', 27, '6'0"', 215, 26, '5 years', 'Ohio State', 'Pittsburgh Steelers', 'PIT', 'AFC North', 'active', 'ESPN'),
('Jaylen Warren', 'RB', 30, '5'8"', 215, 26, '4 years', 'Oklahoma State', 'Pittsburgh Steelers', 'PIT', 'AFC North', 'active', 'ESPN'),
('Jalen Hurts', 'QB', 1, '6'1"', 223, 26, '6 years', 'Oklahoma', 'Philadelphia Eagles', 'PHI', 'NFC East', 'active', 'ESPN'),
('Kyle McCord', 'QB', 19, '6'3"', 218, 22, 'Rookie', 'Syracuse', 'Philadelphia Eagles', 'PHI', 'NFC East', 'active', 'ESPN'),
('Tanner McKee', 'QB', 16, '6'6"', 231, 25, '3 years', 'Stanford', 'Philadelphia Eagles', 'PHI', 'NFC East', 'active', 'ESPN'),
('Dorian Thompson-Robinson', 'QB', 14, '6'2"', 203, 25, '3 years', 'UCLA', 'Philadelphia Eagles', 'PHI', 'NFC East', 'active', 'ESPN'),
('Saquon Barkley', 'RB', 26, '6'0"', 233, 28, '8 years', 'Penn State', 'Philadelphia Eagles', 'PHI', 'NFC East', 'active', 'ESPN'),
('AJ Dillon', 'RB', 29, '6'0"', 247, 27, '6 years', 'Boston College', 'Philadelphia Eagles', 'PHI', 'NFC East', 'active', 'ESPN'),
('Will Shipley', 'RB', 28, '5'11"', 209, 22, '2 years', 'Clemson', 'Philadelphia Eagles', 'PHI', 'NFC East', 'active', 'ESPN'),
('A.J. Brown', 'WR', 11, '6'1"', 226, 27, '7 years', 'Ole Miss', 'Philadelphia Eagles', 'PHI', 'NFC East', 'active', 'ESPN'),
('DeVonta Smith', 'WR', 6, '6'0"', 170, 26, '5 years', 'Alabama', 'Philadelphia Eagles', 'PHI', 'NFC East', 'active', 'ESPN'),
('Dallas Goedert', 'TE', 88, '6'5"', 256, 30, '8 years', 'South Dakota State', 'Philadelphia Eagles', 'PHI', 'NFC East', 'active', 'ESPN'),
('Jalen Carter', 'DT', 98, '6'3"', 314, 24, '3 years', 'Georgia', 'Philadelphia Eagles', 'PHI', 'NFC East', 'active', 'ESPN'),
('Jordan Davis', 'DT', 90, '6'6"', 336, 25, '4 years', 'Georgia', 'Philadelphia Eagles', 'PHI', 'NFC East', 'active', 'ESPN'),
('Nakobe Dean', 'LB', 17, '5'11"', 231, 24, '4 years', 'Georgia', 'Philadelphia Eagles', 'PHI', 'NFC East', 'active', 'ESPN'),
('Lamar Jackson', 'QB', 8, '6'2"', 205, 28, '8 years', 'Louisville', 'Baltimore Ravens', 'BAL', 'AFC North', 'active', 'ESPN'),
('Devin Leary', 'QB', 13, '6'1"', 216, 25, '1 year', 'Kentucky', 'Baltimore Ravens', 'BAL', 'AFC North', 'active', 'ESPN'),
('Cooper Rush', 'QB', 15, '6'3"', 225, 31, '8 years', 'Central Michigan', 'Baltimore Ravens', 'BAL', 'AFC North', 'active', 'ESPN'),
('Derrick Henry', 'RB', 22, '6'2"', 247, 31, '10 years', 'Alabama', 'Baltimore Ravens', 'BAL', 'AFC North', 'active', 'ESPN'),
('Rasheen Ali', 'RB', 26, '5'11"', 212, 24, '2 years', 'Marshall', 'Baltimore Ravens', 'BAL', 'AFC North', 'active', 'ESPN'),
('Justice Hill', 'RB', 43, '5'10"', 195, 27, '7 years', 'Oklahoma State', 'Baltimore Ravens', 'BAL', 'AFC North', 'active', 'ESPN'),
('Keaton Mitchell', 'RB', 34, '5'8"', 191, 23, '3 years', 'East Carolina', 'Baltimore Ravens', 'BAL', 'AFC North', 'active', 'ESPN'),
('Zay Flowers', 'WR', 4, '5'9"', 175, 24, '3 years', 'Boston College', 'Baltimore Ravens', 'BAL', 'AFC North', 'active', 'ESPN'),
('Rashod Bateman', 'WR', 7, '6'1"', 195, 25, '5 years', 'Minnesota', 'Baltimore Ravens', 'BAL', 'AFC North', 'active', 'ESPN'),
('DeAndre Hopkins', 'WR', 10, '6'1"', 218, 33, '13 years', 'Clemson', 'Baltimore Ravens', 'BAL', 'AFC North', 'active', 'ESPN'),
('Mark Andrews', 'TE', 89, '6'5"', 250, 29, '8 years', 'Oklahoma', 'Baltimore Ravens', 'BAL', 'AFC North', 'active', 'ESPN'),
('Isaiah Likely', 'TE', 80, '6'4"', 247, 25, '4 years', 'Coastal Carolina', 'Baltimore Ravens', 'BAL', 'AFC North', 'active', 'ESPN'),
('Jaxson Dart', 'QB', 6, '6'2"', 223, 22, 'Rookie', 'Ole Miss', 'New York Giants', 'NYG', 'NFC East', 'active', 'ESPN'),
('Tommy DeVito', 'QB', 15, '6'2"', 210, 26, '3 years', 'Illinois', 'New York Giants', 'NYG', 'NFC East', 'active', 'ESPN'),
('Russell Wilson', 'QB', 3, '5'11"', 206, 36, '14 years', 'Wisconsin', 'New York Giants', 'NYG', 'NFC East', 'active', 'ESPN'),
('Jameis Winston', 'QB', 19, '6'4"', 231, 31, '11 years', 'Florida State', 'New York Giants', 'NYG', 'NFC East', 'active', 'ESPN'),
('Eric Gray', 'RB', 20, '5'10"', 211, 25, '3 years', 'Oklahoma', 'New York Giants', 'NYG', 'NFC East', 'active', 'ESPN'),
('Devin Singletary', 'RB', 26, '5'7"', 203, 27, '7 years', 'Florida Atlantic', 'New York Giants', 'NYG', 'NFC East', 'active', 'ESPN'),
('Tyrone Tracy Jr.', 'RB', 29, '5'11"', 210, 25, '2 years', 'Purdue', 'New York Giants', 'NYG', 'NFC East', 'active', 'ESPN'),
('Dante Miller', 'RB', 25, '5'9"', 200, 26, '1 year', 'South Carolina', 'New York Giants', 'NYG', 'NFC East', 'active', 'ESPN'),
('Cam Skattebo', 'RB', 44, '5'11"', 215, 23, 'Rookie', 'Arizona State', 'New York Giants', 'NYG', 'NFC East', 'active', 'ESPN');

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_team_position ON nfl_players(team_abbreviation, position);
CREATE INDEX IF NOT EXISTS idx_players_experience ON nfl_players(experience);
CREATE INDEX IF NOT EXISTS idx_players_college ON nfl_players(college);

-- Update team player counts
UPDATE nfl_teams SET player_count = (
    SELECT COUNT(*) FROM nfl_players WHERE nfl_players.team_abbreviation = nfl_teams.abbreviation
);

-- Query examples:
-- SELECT * FROM nfl_players WHERE position = 'QB' ORDER BY team_abbreviation;
-- SELECT team_name, COUNT(*) as player_count FROM nfl_players GROUP BY team_name ORDER BY player_count DESC;
-- SELECT position, COUNT(*) as count FROM nfl_players GROUP BY position ORDER BY count DESC;
