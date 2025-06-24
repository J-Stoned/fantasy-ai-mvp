#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Real teams for each sport
const REAL_NFL_TEAMS = [
  'Arizona Cardinals', 'Atlanta Falcons', 'Baltimore Ravens', 'Buffalo Bills',
  'Carolina Panthers', 'Chicago Bears', 'Cincinnati Bengals', 'Cleveland Browns',
  'Dallas Cowboys', 'Denver Broncos', 'Detroit Lions', 'Green Bay Packers',
  'Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars', 'Kansas City Chiefs',
  'Las Vegas Raiders', 'Los Angeles Chargers', 'Los Angeles Rams', 'Miami Dolphins',
  'Minnesota Vikings', 'New England Patriots', 'New Orleans Saints', 'New York Giants',
  'New York Jets', 'Philadelphia Eagles', 'Pittsburgh Steelers', 'San Francisco 49ers',
  'Seattle Seahawks', 'Tampa Bay Buccaneers', 'Tennessee Titans', 'Washington Commanders'
];

const REAL_NBA_TEAMS = [
  'Atlanta Hawks', 'Boston Celtics', 'Brooklyn Nets', 'Charlotte Hornets',
  'Chicago Bulls', 'Cleveland Cavaliers', 'Dallas Mavericks', 'Denver Nuggets',
  'Detroit Pistons', 'Golden State Warriors', 'Houston Rockets', 'Indiana Pacers',
  'Los Angeles Clippers', 'Los Angeles Lakers', 'Memphis Grizzlies', 'Miami Heat',
  'Milwaukee Bucks', 'Minnesota Timberwolves', 'New Orleans Pelicans', 'New York Knicks',
  'Oklahoma City Thunder', 'Orlando Magic', 'Philadelphia 76ers', 'Phoenix Suns',
  'Portland Trail Blazers', 'Sacramento Kings', 'San Antonio Spurs', 'Toronto Raptors',
  'Utah Jazz', 'Washington Wizards'
];

const REAL_MLB_TEAMS = [
  'Arizona Diamondbacks', 'Atlanta Braves', 'Baltimore Orioles', 'Boston Red Sox',
  'Chicago Cubs', 'Chicago White Sox', 'Cincinnati Reds', 'Cleveland Guardians',
  'Colorado Rockies', 'Detroit Tigers', 'Houston Astros', 'Kansas City Royals',
  'Los Angeles Angels', 'Los Angeles Dodgers', 'Miami Marlins', 'Milwaukee Brewers',
  'Minnesota Twins', 'New York Mets', 'New York Yankees', 'Oakland Athletics',
  'Philadelphia Phillies', 'Pittsburgh Pirates', 'San Diego Padres', 'San Francisco Giants',
  'Seattle Mariners', 'St. Louis Cardinals', 'Tampa Bay Rays', 'Texas Rangers',
  'Toronto Blue Jays', 'Washington Nationals'
];

const REAL_NHL_TEAMS = [
  'Anaheim Ducks', 'Arizona Coyotes', 'Boston Bruins', 'Buffalo Sabres',
  'Calgary Flames', 'Carolina Hurricanes', 'Chicago Blackhawks', 'Colorado Avalanche',
  'Columbus Blue Jackets', 'Dallas Stars', 'Detroit Red Wings', 'Edmonton Oilers',
  'Florida Panthers', 'Los Angeles Kings', 'Minnesota Wild', 'Montreal Canadiens',
  'Nashville Predators', 'New Jersey Devils', 'New York Islanders', 'New York Rangers',
  'Ottawa Senators', 'Philadelphia Flyers', 'Pittsburgh Penguins', 'San Jose Sharks',
  'Seattle Kraken', 'St. Louis Blues', 'Tampa Bay Lightning', 'Toronto Maple Leafs',
  'Vancouver Canucks', 'Vegas Golden Knights', 'Washington Capitals', 'Winnipeg Jets'
];

async function checkRealTeams() {
  console.log('🏆 CHECKING REAL TEAM COVERAGE');
  console.log('===============================\n');
  
  try {
    // Get all unique teams in database
    const dbTeams = await prisma.player.groupBy({
      by: ['team'],
      _count: true
    });
    
    const teamNames = dbTeams.map(t => t.team);
    
    // Check NFL coverage
    console.log('🏈 NFL TEAMS (32 total):');
    const nflCovered = REAL_NFL_TEAMS.filter(team => 
      teamNames.some(dbTeam => dbTeam.includes(team.split(' ').pop()))
    );
    console.log(`✅ Covered: ${nflCovered.length}/32 teams`);
    
    // Check NBA coverage  
    console.log('\n🏀 NBA TEAMS (30 total):');
    const nbaCovered = REAL_NBA_TEAMS.filter(team =>
      teamNames.some(dbTeam => dbTeam.includes(team.split(' ').pop()))
    );
    console.log(`✅ Covered: ${nbaCovered.length}/30 teams`);
    
    // Check MLB coverage
    console.log('\n⚾ MLB TEAMS (30 total):');
    const mlbCovered = REAL_MLB_TEAMS.filter(team =>
      teamNames.some(dbTeam => dbTeam.includes(team.split(' ').pop()))
    );
    console.log(`✅ Covered: ${mlbCovered.length}/30 teams`);
    
    // Check NHL coverage
    console.log('\n🏒 NHL TEAMS (32 total):');
    const nhlCovered = REAL_NHL_TEAMS.filter(team =>
      teamNames.some(dbTeam => dbTeam.includes(team.split(' ').pop()))
    );
    console.log(`✅ Covered: ${nhlCovered.length}/32 teams`);
    
    // Summary
    console.log('\n📊 OVERALL COVERAGE:');
    console.log('-------------------');
    console.log(`Total real teams: 124 (32 NFL + 30 NBA + 30 MLB + 32 NHL)`);
    console.log(`Total covered: ${nflCovered.length + nbaCovered.length + mlbCovered.length + nhlCovered.length}`);
    console.log(`Coverage percentage: ${Math.round((nflCovered.length + nbaCovered.length + mlbCovered.length + nhlCovered.length) / 124 * 100)}%`);
    
    // Check for star players
    console.log('\n⭐ CHECKING FOR STAR PLAYERS:');
    const starPlayers = [
      'Patrick Mahomes', 'Josh Allen', 'Justin Jefferson', 'Tyreek Hill',
      'LeBron James', 'Stephen Curry', 'Giannis Antetokounmpo', 'Nikola Jokic',
      'Mike Trout', 'Shohei Ohtani', 'Aaron Judge', 'Mookie Betts',
      'Connor McDavid', 'Auston Matthews', 'Nathan MacKinnon'
    ];
    
    for (const starName of starPlayers) {
      const player = await prisma.player.findFirst({
        where: { name: { contains: starName } }
      });
      console.log(`${player ? '✅' : '❌'} ${starName}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRealTeams();