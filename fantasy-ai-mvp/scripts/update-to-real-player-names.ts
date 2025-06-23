#!/usr/bin/env tsx

/**
 * 🏆 REAL PLAYER NAMES UPDATER - Transform Generic Names to Real Athletes
 * Updates our 5,000+ player database with actual player names
 * Mission: "49ers QB1" → "Brock Purdy" across ALL sports!
 */

import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// REAL PLAYER DATA - Top players for each team/position
const REAL_PLAYERS = {
  NFL: {
    // AFC East
    'Bills QB1': 'Josh Allen',
    'Bills QB2': 'Kyle Allen',
    'Bills RB1': 'James Cook',
    'Bills RB2': 'Latavius Murray',
    'Bills WR1': 'Stefon Diggs',
    'Bills WR2': 'Gabe Davis',
    'Bills WR3': 'Khalil Shakir',
    'Bills TE1': 'Dalton Kincaid',
    'Bills TE2': 'Dawson Knox',
    
    'Dolphins QB1': 'Tua Tagovailoa',
    'Dolphins QB2': 'Mike White',
    'Dolphins RB1': 'De\'Von Achane',
    'Dolphins RB2': 'Raheem Mostert',
    'Dolphins WR1': 'Tyreek Hill',
    'Dolphins WR2': 'Jaylen Waddle',
    'Dolphins WR3': 'Braxton Berrios',
    'Dolphins TE1': 'Durham Smythe',
    
    'Patriots QB1': 'Drake Maye',
    'Patriots QB2': 'Bailey Zappe',
    'Patriots RB1': 'Rhamondre Stevenson',
    'Patriots RB2': 'Antonio Gibson',
    'Patriots WR1': 'Kendrick Bourne',
    'Patriots WR2': 'DeMario Douglas',
    'Patriots WR3': 'JuJu Smith-Schuster',
    'Patriots TE1': 'Hunter Henry',
    
    'Jets QB1': 'Aaron Rodgers',
    'Jets QB2': 'Tyrod Taylor',
    'Jets RB1': 'Breece Hall',
    'Jets RB2': 'Dalvin Cook',
    'Jets WR1': 'Garrett Wilson',
    'Jets WR2': 'Davante Adams',
    'Jets WR3': 'Allen Lazard',
    'Jets TE1': 'Tyler Conklin',
    
    // AFC North
    'Ravens QB1': 'Lamar Jackson',
    'Ravens QB2': 'Tyler Huntley',
    'Ravens RB1': 'Derrick Henry',
    'Ravens RB2': 'Justice Hill',
    'Ravens WR1': 'Zay Flowers',
    'Ravens WR2': 'Odell Beckham Jr.',
    'Ravens WR3': 'Rashod Bateman',
    'Ravens TE1': 'Mark Andrews',
    'Ravens TE2': 'Isaiah Likely',
    
    'Bengals QB1': 'Joe Burrow',
    'Bengals QB2': 'Jake Browning',
    'Bengals RB1': 'Joe Mixon',
    'Bengals RB2': 'Chase Brown',
    'Bengals WR1': 'Ja\'Marr Chase',
    'Bengals WR2': 'Tee Higgins',
    'Bengals WR3': 'Tyler Boyd',
    'Bengals TE1': 'Mike Gesicki',
    
    'Browns QB1': 'Deshaun Watson',
    'Browns QB2': 'Jameis Winston',
    'Browns RB1': 'Nick Chubb',
    'Browns RB2': 'Jerome Ford',
    'Browns WR1': 'Amari Cooper',
    'Browns WR2': 'Jerry Jeudy',
    'Browns WR3': 'Elijah Moore',
    'Browns TE1': 'David Njoku',
    
    'Steelers QB1': 'Russell Wilson',
    'Steelers QB2': 'Justin Fields',
    'Steelers RB1': 'Najee Harris',
    'Steelers RB2': 'Jaylen Warren',
    'Steelers WR1': 'George Pickens',
    'Steelers WR2': 'Calvin Austin III',
    'Steelers WR3': 'Van Jefferson',
    'Steelers TE1': 'Pat Freiermuth',
    
    // AFC South
    'Texans QB1': 'C.J. Stroud',
    'Texans QB2': 'Davis Mills',
    'Texans RB1': 'Joe Mixon',
    'Texans RB2': 'Dameon Pierce',
    'Texans WR1': 'Stefon Diggs',
    'Texans WR2': 'Nico Collins',
    'Texans WR3': 'Tank Dell',
    'Texans TE1': 'Dalton Schultz',
    
    'Colts QB1': 'Anthony Richardson',
    'Colts QB2': 'Joe Flacco',
    'Colts RB1': 'Jonathan Taylor',
    'Colts RB2': 'Trey Sermon',
    'Colts WR1': 'Michael Pittman Jr.',
    'Colts WR2': 'Josh Downs',
    'Colts WR3': 'Alec Pierce',
    'Colts TE1': 'Kylen Granson',
    
    'Jaguars QB1': 'Trevor Lawrence',
    'Jaguars QB2': 'Mac Jones',
    'Jaguars RB1': 'Travis Etienne',
    'Jaguars RB2': 'Tank Bigsby',
    'Jaguars WR1': 'Calvin Ridley',
    'Jaguars WR2': 'Christian Kirk',
    'Jaguars WR3': 'Gabe Davis',
    'Jaguars TE1': 'Evan Engram',
    
    'Titans QB1': 'Will Levis',
    'Titans QB2': 'Mason Rudolph',
    'Titans RB1': 'Tony Pollard',
    'Titans RB2': 'Tyjae Spears',
    'Titans WR1': 'Calvin Ridley',
    'Titans WR2': 'DeAndre Hopkins',
    'Titans WR3': 'Tyler Boyd',
    'Titans TE1': 'Chigoziem Okonkwo',
    
    // AFC West
    'Broncos QB1': 'Bo Nix',
    'Broncos QB2': 'Jarrett Stidham',
    'Broncos RB1': 'Javonte Williams',
    'Broncos RB2': 'Jaleel McLaughlin',
    'Broncos WR1': 'Courtland Sutton',
    'Broncos WR2': 'Marvin Mims Jr.',
    'Broncos WR3': 'Josh Reynolds',
    'Broncos TE1': 'Adam Trautman',
    
    'Chiefs QB1': 'Patrick Mahomes',
    'Chiefs QB2': 'Carson Wentz',
    'Chiefs RB1': 'Isiah Pacheco',
    'Chiefs RB2': 'Kareem Hunt',
    'Chiefs WR1': 'DeAndre Hopkins',
    'Chiefs WR2': 'Xavier Worthy',
    'Chiefs WR3': 'JuJu Smith-Schuster',
    'Chiefs TE1': 'Travis Kelce',
    'Chiefs TE2': 'Noah Gray',
    
    'Raiders QB1': 'Gardner Minshew',
    'Raiders QB2': 'Aidan O\'Connell',
    'Raiders RB1': 'Alexander Mattison',
    'Raiders RB2': 'Zamir White',
    'Raiders WR1': 'Davante Adams',
    'Raiders WR2': 'Jakobi Meyers',
    'Raiders WR3': 'Tre Tucker',
    'Raiders TE1': 'Brock Bowers',
    
    'Chargers QB1': 'Justin Herbert',
    'Chargers QB2': 'Easton Stick',
    'Chargers RB1': 'J.K. Dobbins',
    'Chargers RB2': 'Gus Edwards',
    'Chargers WR1': 'Ladd McConkey',
    'Chargers WR2': 'Quentin Johnston',
    'Chargers WR3': 'Joshua Palmer',
    'Chargers TE1': 'Will Dissly',
    
    // NFC East
    'Cowboys QB1': 'Dak Prescott',
    'Cowboys QB2': 'Cooper Rush',
    'Cowboys RB1': 'Rico Dowdle',
    'Cowboys RB2': 'Ezekiel Elliott',
    'Cowboys WR1': 'CeeDee Lamb',
    'Cowboys WR2': 'Jalen Tolbert',
    'Cowboys WR3': 'KaVontae Turpin',
    'Cowboys TE1': 'Jake Ferguson',
    
    'Giants QB1': 'Daniel Jones',
    'Giants QB2': 'Drew Lock',
    'Giants RB1': 'Devin Singletary',
    'Giants RB2': 'Tyrone Tracy Jr.',
    'Giants WR1': 'Malik Nabers',
    'Giants WR2': 'Wan\'Dale Robinson',
    'Giants WR3': 'Darius Slayton',
    'Giants TE1': 'Theo Johnson',
    
    'Eagles QB1': 'Jalen Hurts',
    'Eagles QB2': 'Kenny Pickett',
    'Eagles RB1': 'Saquon Barkley',
    'Eagles RB2': 'Kenneth Gainwell',
    'Eagles WR1': 'A.J. Brown',
    'Eagles WR2': 'DeVonta Smith',
    'Eagles WR3': 'Britain Covey',
    'Eagles TE1': 'Dallas Goedert',
    
    'Commanders QB1': 'Jayden Daniels',
    'Commanders QB2': 'Marcus Mariota',
    'Commanders RB1': 'Brian Robinson Jr.',
    'Commanders RB2': 'Austin Ekeler',
    'Commanders WR1': 'Terry McLaurin',
    'Commanders WR2': 'Noah Brown',
    'Commanders WR3': 'Dyami Brown',
    'Commanders TE1': 'Zach Ertz',
    
    // NFC North
    'Bears QB1': 'Caleb Williams',
    'Bears QB2': 'Tyson Bagent',
    'Bears RB1': 'D\'Andre Swift',
    'Bears RB2': 'Roschon Johnson',
    'Bears WR1': 'DJ Moore',
    'Bears WR2': 'Keenan Allen',
    'Bears WR3': 'Rome Odunze',
    'Bears TE1': 'Cole Kmet',
    
    'Lions QB1': 'Jared Goff',
    'Lions QB2': 'Hendon Hooker',
    'Lions RB1': 'Jahmyr Gibbs',
    'Lions RB2': 'David Montgomery',
    'Lions WR1': 'Amon-Ra St. Brown',
    'Lions WR2': 'Jameson Williams',
    'Lions WR3': 'Tim Patrick',
    'Lions TE1': 'Sam LaPorta',
    
    'Packers QB1': 'Jordan Love',
    'Packers QB2': 'Malik Willis',
    'Packers RB1': 'Josh Jacobs',
    'Packers RB2': 'Emanuel Wilson',
    'Packers WR1': 'Jayden Reed',
    'Packers WR2': 'Romeo Doubs',
    'Packers WR3': 'Christian Watson',
    'Packers TE1': 'Tucker Kraft',
    
    'Vikings QB1': 'Sam Darnold',
    'Vikings QB2': 'Nick Mullens',
    'Vikings RB1': 'Aaron Jones',
    'Vikings RB2': 'Ty Chandler',
    'Vikings WR1': 'Justin Jefferson',
    'Vikings WR2': 'Jordan Addison',
    'Vikings WR3': 'K.J. Osborn',
    'Vikings TE1': 'T.J. Hockenson',
    
    // NFC South
    'Falcons QB1': 'Kirk Cousins',
    'Falcons QB2': 'Michael Penix Jr.',
    'Falcons RB1': 'Bijan Robinson',
    'Falcons RB2': 'Tyler Allgeier',
    'Falcons WR1': 'Drake London',
    'Falcons WR2': 'Darnell Mooney',
    'Falcons WR3': 'Ray-Ray McCloud',
    'Falcons TE1': 'Kyle Pitts',
    
    'Panthers QB1': 'Bryce Young',
    'Panthers QB2': 'Andy Dalton',
    'Panthers RB1': 'Chuba Hubbard',
    'Panthers RB2': 'Miles Sanders',
    'Panthers WR1': 'Diontae Johnson',
    'Panthers WR2': 'Adam Thielen',
    'Panthers WR3': 'Xavier Legette',
    'Panthers TE1': 'Tommy Tremble',
    
    'Saints QB1': 'Derek Carr',
    'Saints QB2': 'Spencer Rattler',
    'Saints RB1': 'Alvin Kamara',
    'Saints RB2': 'Jamaal Williams',
    'Saints WR1': 'Chris Olave',
    'Saints WR2': 'Rashid Shaheed',
    'Saints WR3': 'Marquez Valdes-Scantling',
    'Saints TE1': 'Foster Moreau',
    
    'Buccaneers QB1': 'Baker Mayfield',
    'Buccaneers QB2': 'Kyle Trask',
    'Buccaneers RB1': 'Rachaad White',
    'Buccaneers RB2': 'Bucky Irving',
    'Buccaneers WR1': 'Mike Evans',
    'Buccaneers WR2': 'Chris Godwin',
    'Buccaneers WR3': 'Jalen McMillan',
    'Buccaneers TE1': 'Cade Otton',
    
    // NFC West
    'Cardinals QB1': 'Kyler Murray',
    'Cardinals QB2': 'Clayton Tune',
    'Cardinals RB1': 'James Conner',
    'Cardinals RB2': 'Trey Benson',
    'Cardinals WR1': 'Marvin Harrison Jr.',
    'Cardinals WR2': 'Michael Wilson',
    'Cardinals WR3': 'Greg Dortch',
    'Cardinals TE1': 'Trey McBride',
    
    'Rams QB1': 'Matthew Stafford',
    'Rams QB2': 'Jimmy Garoppolo',
    'Rams RB1': 'Kyren Williams',
    'Rams RB2': 'Blake Corum',
    'Rams WR1': 'Cooper Kupp',
    'Rams WR2': 'Puka Nacua',
    'Rams WR3': 'Demarcus Robinson',
    'Rams TE1': 'Tyler Higbee',
    
    '49ers QB1': 'Brock Purdy',
    '49ers QB2': 'Sam Darnold',
    '49ers RB1': 'Christian McCaffrey',
    '49ers RB2': 'Jordan Mason',
    '49ers WR1': 'Deebo Samuel',
    '49ers WR2': 'Brandon Aiyuk',
    '49ers WR3': 'Jauan Jennings',
    '49ers TE1': 'George Kittle',
    
    'Seahawks QB1': 'Geno Smith',
    'Seahawks QB2': 'Sam Howell',
    'Seahawks RB1': 'Kenneth Walker III',
    'Seahawks RB2': 'Zach Charbonnet',
    'Seahawks WR1': 'DK Metcalf',
    'Seahawks WR2': 'Tyler Lockett',
    'Seahawks WR3': 'Jaxon Smith-Njigba',
    'Seahawks TE1': 'Noah Fant',
    
    // Centers (C)
    '49ers C1': 'Jake Brendel',
    'Bills C1': 'Connor McGovern',
    'Ravens C1': 'Tyler Linderbaum',
    'Eagles C1': 'Jason Kelce',
    'Chiefs C1': 'Creed Humphrey',
    'Cowboys C1': 'Tyler Biadasz',
    'Lions C1': 'Frank Ragnow',
    'Colts C1': 'Ryan Kelly',
  },
  
  NBA: {
    // Atlantic Division
    '76ers PG1': 'Joel Embiid',
    '76ers SG1': 'Tyrese Maxey',
    '76ers SF1': 'Paul George',
    '76ers PF1': 'Tobias Harris',
    '76ers C1': 'Andre Drummond',
    
    'Celtics PG1': 'Jrue Holiday',
    'Celtics SG1': 'Jaylen Brown',
    'Celtics SF1': 'Jayson Tatum',
    'Celtics PF1': 'Kristaps Porzingis',
    'Celtics C1': 'Al Horford',
    
    'Nets PG1': 'Dennis Schroder',
    'Nets SG1': 'Cam Thomas',
    'Nets SF1': 'Mikal Bridges',
    'Nets PF1': 'Cameron Johnson',
    'Nets C1': 'Nicolas Claxton',
    
    'Knicks PG1': 'Jalen Brunson',
    'Knicks SG1': 'RJ Barrett',
    'Knicks SF1': 'OG Anunoby',
    'Knicks PF1': 'Julius Randle',
    'Knicks C1': 'Mitchell Robinson',
    
    'Raptors PG1': 'Dennis Schroder',
    'Raptors SG1': 'Gary Trent Jr.',
    'Raptors SF1': 'Scottie Barnes',
    'Raptors PF1': 'Pascal Siakam',
    'Raptors C1': 'Jakob Poeltl',
    
    // Central Division
    'Bulls PG1': 'Coby White',
    'Bulls SG1': 'Zach LaVine',
    'Bulls SF1': 'DeMar DeRozan',
    'Bulls PF1': 'Patrick Williams',
    'Bulls C1': 'Nikola Vucevic',
    
    'Cavaliers PG1': 'Darius Garland',
    'Cavaliers SG1': 'Donovan Mitchell',
    'Cavaliers SF1': 'Max Strus',
    'Cavaliers PF1': 'Evan Mobley',
    'Cavaliers C1': 'Jarrett Allen',
    
    'Pistons PG1': 'Cade Cunningham',
    'Pistons SG1': 'Jaden Ivey',
    'Pistons SF1': 'Ausar Thompson',
    'Pistons PF1': 'Isaiah Stewart',
    'Pistons C1': 'Jalen Duren',
    
    'Pacers PG1': 'Tyrese Haliburton',
    'Pacers SG1': 'Benedict Mathurin',
    'Pacers SF1': 'Bruce Brown',
    'Pacers PF1': 'Obi Toppin',
    'Pacers C1': 'Myles Turner',
    
    'Bucks PG1': 'Damian Lillard',
    'Bucks SG1': 'Khris Middleton',
    'Bucks SF1': 'Giannis Antetokounmpo',
    'Bucks PF1': 'Bobby Portis',
    'Bucks C1': 'Brook Lopez',
    
    // Southeast Division
    'Hawks PG1': 'Trae Young',
    'Hawks SG1': 'Dejounte Murray',
    'Hawks SF1': 'De\'Andre Hunter',
    'Hawks PF1': 'Jalen Johnson',
    'Hawks C1': 'Clint Capela',
    
    'Hornets PG1': 'LaMelo Ball',
    'Hornets SG1': 'Terry Rozier',
    'Hornets SF1': 'Miles Bridges',
    'Hornets PF1': 'P.J. Washington',
    'Hornets C1': 'Mark Williams',
    
    'Heat PG1': 'Tyler Herro',
    'Heat SG1': 'Duncan Robinson',
    'Heat SF1': 'Jimmy Butler',
    'Heat PF1': 'Kevin Love',
    'Heat C1': 'Bam Adebayo',
    
    'Magic PG1': 'Markelle Fultz',
    'Magic SG1': 'Jalen Suggs',
    'Magic SF1': 'Franz Wagner',
    'Magic PF1': 'Paolo Banchero',
    'Magic C1': 'Wendell Carter Jr.',
    
    'Wizards PG1': 'Tyus Jones',
    'Wizards SG1': 'Jordan Poole',
    'Wizards SF1': 'Kyle Kuzma',
    'Wizards PF1': 'Deni Avdija',
    'Wizards C1': 'Daniel Gafford',
    
    // Northwest Division
    'Nuggets PG1': 'Jamal Murray',
    'Nuggets SG1': 'Kentavious Caldwell-Pope',
    'Nuggets SF1': 'Michael Porter Jr.',
    'Nuggets PF1': 'Aaron Gordon',
    'Nuggets C1': 'Nikola Jokic',
    
    'Timberwolves PG1': 'Mike Conley',
    'Timberwolves SG1': 'Anthony Edwards',
    'Timberwolves SF1': 'Jaden McDaniels',
    'Timberwolves PF1': 'Karl-Anthony Towns',
    'Timberwolves C1': 'Rudy Gobert',
    
    'Thunder PG1': 'Shai Gilgeous-Alexander',
    'Thunder SG1': 'Josh Giddey',
    'Thunder SF1': 'Jalen Williams',
    'Thunder PF1': 'Chet Holmgren',
    'Thunder C1': 'Isaiah Hartenstein',
    
    'Trail Blazers PG1': 'Scoot Henderson',
    'Trail Blazers SG1': 'Anfernee Simons',
    'Trail Blazers SF1': 'Shaedon Sharpe',
    'Trail Blazers PF1': 'Jerami Grant',
    'Trail Blazers C1': 'Deandre Ayton',
    
    'Jazz PG1': 'Collin Sexton',
    'Jazz SG1': 'Jordan Clarkson',
    'Jazz SF1': 'Lauri Markkanen',
    'Jazz PF1': 'John Collins',
    'Jazz C1': 'Walker Kessler',
    
    // Pacific Division
    'Warriors PG1': 'Stephen Curry',
    'Warriors SG1': 'Klay Thompson',
    'Warriors SF1': 'Andrew Wiggins',
    'Warriors PF1': 'Draymond Green',
    'Warriors C1': 'Kevon Looney',
    
    'Clippers PG1': 'Russell Westbrook',
    'Clippers SG1': 'James Harden',
    'Clippers SF1': 'Kawhi Leonard',
    'Clippers PF1': 'Paul George',
    'Clippers C1': 'Ivica Zubac',
    
    'Lakers PG1': 'D\'Angelo Russell',
    'Lakers SG1': 'Austin Reaves',
    'Lakers SF1': 'LeBron James',
    'Lakers PF1': 'Rui Hachimura',
    'Lakers C1': 'Anthony Davis',
    
    'Suns PG1': 'Bradley Beal',
    'Suns SG1': 'Devin Booker',
    'Suns SF1': 'Kevin Durant',
    'Suns PF1': 'Bol Bol',
    'Suns C1': 'Jusuf Nurkic',
    
    'Kings PG1': 'De\'Aaron Fox',
    'Kings SG1': 'Kevin Huerter',
    'Kings SF1': 'Harrison Barnes',
    'Kings PF1': 'Keegan Murray',
    'Kings C1': 'Domantas Sabonis',
    
    // Southwest Division
    'Grizzlies PG1': 'Ja Morant',
    'Grizzlies SG1': 'Desmond Bane',
    'Grizzlies SF1': 'Luke Kennard',
    'Grizzlies PF1': 'Jaren Jackson Jr.',
    'Grizzlies C1': 'Steven Adams',
    
    'Mavericks PG1': 'Luka Doncic',
    'Mavericks SG1': 'Kyrie Irving',
    'Mavericks SF1': 'Grant Williams',
    'Mavericks PF1': 'Maxi Kleber',
    'Mavericks C1': 'Daniel Gafford',
    
    'Pelicans PG1': 'CJ McCollum',
    'Pelicans SG1': 'Herb Jones',
    'Pelicans SF1': 'Brandon Ingram',
    'Pelicans PF1': 'Zion Williamson',
    'Pelicans C1': 'Jonas Valanciunas',
    
    'Rockets PG1': 'Fred VanVleet',
    'Rockets SG1': 'Jalen Green',
    'Rockets SF1': 'Dillon Brooks',
    'Rockets PF1': 'Jabari Smith Jr.',
    'Rockets C1': 'Alperen Sengun',
    
    'Spurs PG1': 'Tre Jones',
    'Spurs SG1': 'Devin Vassell',
    'Spurs SF1': 'Keldon Johnson',
    'Spurs PF1': 'Victor Wembanyama',
    'Spurs C1': 'Zach Collins',
  },
  
  MLB: {
    // AL East
    'Orioles C1': 'Adley Rutschman',
    'Orioles 1B1': 'Ryan Mountcastle',
    'Orioles 2B1': 'Adam Frazier',
    'Orioles SS1': 'Gunnar Henderson',
    'Orioles 3B1': 'Jordan Westburg',
    'Orioles LF1': 'Austin Hays',
    'Orioles CF1': 'Cedric Mullins',
    'Orioles RF1': 'Anthony Santander',
    'Orioles SP1': 'Kyle Bradish',
    'Orioles SP2': 'Grayson Rodriguez',
    'Orioles SP3': 'John Means',
    'Orioles RP1': 'Felix Bautista',
    
    'Red Sox C1': 'Connor Wong',
    'Red Sox 1B1': 'Triston Casas',
    'Red Sox 2B1': 'Vaughn Grissom',
    'Red Sox SS1': 'Trevor Story',
    'Red Sox 3B1': 'Rafael Devers',
    'Red Sox LF1': 'Masataka Yoshida',
    'Red Sox CF1': 'Jarren Duran',
    'Red Sox RF1': 'Wilyer Abreu',
    'Red Sox SP1': 'Lucas Giolito',
    'Red Sox SP2': 'Brayan Bello',
    'Red Sox SP3': 'Nick Pivetta',
    'Red Sox RP1': 'Kenley Jansen',
    
    'Yankees C1': 'Jose Trevino',
    'Yankees 1B1': 'Anthony Rizzo',
    'Yankees 2B1': 'Gleyber Torres',
    'Yankees SS1': 'Anthony Volpe',
    'Yankees 3B1': 'DJ LeMahieu',
    'Yankees LF1': 'Alex Verdugo',
    'Yankees CF1': 'Harrison Bader',
    'Yankees RF1': 'Aaron Judge',
    'Yankees SP1': 'Gerrit Cole',
    'Yankees SP2': 'Carlos Rodon',
    'Yankees SP3': 'Nestor Cortes',
    'Yankees RP1': 'Clay Holmes',
    
    'Rays C1': 'Rene Pinto',
    'Rays 1B1': 'Yandy Diaz',
    'Rays 2B1': 'Brandon Lowe',
    'Rays SS1': 'Wander Franco',
    'Rays 3B1': 'Isaac Paredes',
    'Rays LF1': 'Randy Arozarena',
    'Rays CF1': 'Jose Siri',
    'Rays RF1': 'Josh Lowe',
    'Rays SP1': 'Zach Eflin',
    'Rays SP2': 'Shane Baz',
    'Rays SP3': 'Tyler Glasnow',
    'Rays RP1': 'Pete Fairbanks',
    
    'Blue Jays C1': 'Danny Jansen',
    'Blue Jays 1B1': 'Vladimir Guerrero Jr.',
    'Blue Jays 2B1': 'Cavan Biggio',
    'Blue Jays SS1': 'Bo Bichette',
    'Blue Jays 3B1': 'Matt Chapman',
    'Blue Jays LF1': 'Daulton Varsho',
    'Blue Jays CF1': 'Kevin Kiermaier',
    'Blue Jays RF1': 'George Springer',
    'Blue Jays SP1': 'Kevin Gausman',
    'Blue Jays SP2': 'Chris Bassitt',
    'Blue Jays SP3': 'Jose Berrios',
    'Blue Jays RP1': 'Jordan Romano',
    
    // AL Central
    'Guardians C1': 'Austin Hedges',
    'Guardians 1B1': 'Josh Naylor',
    'Guardians 2B1': 'Andres Gimenez',
    'Guardians SS1': 'Amed Rosario',
    'Guardians 3B1': 'Jose Ramirez',
    'Guardians LF1': 'Steven Kwan',
    'Guardians CF1': 'Myles Straw',
    'Guardians RF1': 'Oscar Gonzalez',
    'Guardians SP1': 'Shane Bieber',
    'Guardians SP2': 'Triston McKenzie',
    'Guardians SP3': 'Cal Quantrill',
    'Guardians RP1': 'Emmanuel Clase',
    
    'White Sox C1': 'Yasmani Grandal',
    'White Sox 1B1': 'Andrew Vaughn',
    'White Sox 2B1': 'Elvis Andrus',
    'White Sox SS1': 'Tim Anderson',
    'White Sox 3B1': 'Yoan Moncada',
    'White Sox LF1': 'Andrew Benintendi',
    'White Sox CF1': 'Luis Robert Jr.',
    'White Sox RF1': 'Eloy Jimenez',
    'White Sox SP1': 'Dylan Cease',
    'White Sox SP2': 'Lucas Giolito',
    'White Sox SP3': 'Michael Kopech',
    'White Sox RP1': 'Liam Hendriks',
    
    'Tigers C1': 'Jake Rogers',
    'Tigers 1B1': 'Spencer Torkelson',
    'Tigers 2B1': 'Colt Keith',
    'Tigers SS1': 'Javier Baez',
    'Tigers 3B1': 'Matt Vierling',
    'Tigers LF1': 'Riley Greene',
    'Tigers CF1': 'Parker Meadows',
    'Tigers RF1': 'Kerry Carpenter',
    'Tigers SP1': 'Tarik Skubal',
    'Tigers SP2': 'Jack Flaherty',
    'Tigers SP3': 'Reese Olson',
    'Tigers RP1': 'Jason Foley',
    
    'Royals C1': 'Salvador Perez',
    'Royals 1B1': 'Vinnie Pasquantino',
    'Royals 2B1': 'Michael Massey',
    'Royals SS1': 'Bobby Witt Jr.',
    'Royals 3B1': 'Maikel Garcia',
    'Royals LF1': 'MJ Melendez',
    'Royals CF1': 'Kyle Isbel',
    'Royals RF1': 'Edward Olivares',
    'Royals SP1': 'Cole Ragans',
    'Royals SP2': 'Seth Lugo',
    'Royals SP3': 'Brady Singer',
    'Royals RP1': 'James McArthur',
    
    'Twins C1': 'Ryan Jeffers',
    'Twins 1B1': 'Christian Vazquez',
    'Twins 2B1': 'Jorge Polanco',
    'Twins SS1': 'Carlos Correa',
    'Twins 3B1': 'Royce Lewis',
    'Twins LF1': 'Max Kepler',
    'Twins CF1': 'Byron Buxton',
    'Twins RF1': 'Matt Wallner',
    'Twins SP1': 'Pablo Lopez',
    'Twins SP2': 'Joe Ryan',
    'Twins SP3': 'Bailey Ober',
    'Twins RP1': 'Jhoan Duran',
    
    // AL West
    'Astros C1': 'Martin Maldonado',
    'Astros 1B1': 'Jose Abreu',
    'Astros 2B1': 'Jose Altuve',
    'Astros SS1': 'Jeremy Pena',
    'Astros 3B1': 'Alex Bregman',
    'Astros LF1': 'Yordan Alvarez',
    'Astros CF1': 'Chas McCormick',
    'Astros RF1': 'Kyle Tucker',
    'Astros SP1': 'Framber Valdez',
    'Astros SP2': 'Hunter Brown',
    'Astros SP3': 'Cristian Javier',
    'Astros RP1': 'Ryan Pressly',
    
    'Angels C1': 'Logan O\'Hoppe',
    'Angels 1B1': 'Nolan Schanuel',
    'Angels 2B1': 'Brandon Drury',
    'Angels SS1': 'Zach Neto',
    'Angels 3B1': 'Anthony Rendon',
    'Angels LF1': 'Taylor Ward',
    'Angels CF1': 'Mike Trout',
    'Angels RF1': 'Jo Adell',
    'Angels DH1': 'Shohei Ohtani',
    'Angels SP1': 'Patrick Sandoval',
    'Angels SP2': 'Tyler Anderson',
    'Angels SP3': 'Reid Detmers',
    'Angels RP1': 'Carlos Estevez',
    
    'Athletics C1': 'Shea Langeliers',
    'Athletics 1B1': 'Ryan Noda',
    'Athletics 2B1': 'Zack Gelof',
    'Athletics SS1': 'Nick Allen',
    'Athletics 3B1': 'Jordan Diaz',
    'Athletics LF1': 'Seth Brown',
    'Athletics CF1': 'Esteury Ruiz',
    'Athletics RF1': 'Lawrence Butler',
    'Athletics SP1': 'Paul Blackburn',
    'Athletics SP2': 'JP Sears',
    'Athletics SP3': 'Alex Wood',
    'Athletics RP1': 'Mason Miller',
    
    'Mariners C1': 'Cal Raleigh',
    'Mariners 1B1': 'Ty France',
    'Mariners 2B1': 'Jose Caballero',
    'Mariners SS1': 'J.P. Crawford',
    'Mariners 3B1': 'Eugenio Suarez',
    'Mariners LF1': 'Jarred Kelenic',
    'Mariners CF1': 'Julio Rodriguez',
    'Mariners RF1': 'Teoscar Hernandez',
    'Mariners SP1': 'Luis Castillo',
    'Mariners SP2': 'George Kirby',
    'Mariners SP3': 'Logan Gilbert',
    'Mariners RP1': 'Andres Munoz',
    
    'Rangers C1': 'Jonah Heim',
    'Rangers 1B1': 'Nathaniel Lowe',
    'Rangers 2B1': 'Marcus Semien',
    'Rangers SS1': 'Corey Seager',
    'Rangers 3B1': 'Josh Jung',
    'Rangers LF1': 'Evan Carter',
    'Rangers CF1': 'Leody Taveras',
    'Rangers RF1': 'Adolis Garcia',
    'Rangers SP1': 'Nathan Eovaldi',
    'Rangers SP2': 'Jon Gray',
    'Rangers SP3': 'Andrew Heaney',
    'Rangers RP1': 'Jose Leclerc',
    
    // NL East
    'Braves C1': 'Sean Murphy',
    'Braves 1B1': 'Matt Olson',
    'Braves 2B1': 'Ozzie Albies',
    'Braves SS1': 'Orlando Arcia',
    'Braves 3B1': 'Austin Riley',
    'Braves LF1': 'Eddie Rosario',
    'Braves CF1': 'Michael Harris II',
    'Braves RF1': 'Ronald Acuna Jr.',
    'Braves SP1': 'Spencer Strider',
    'Braves SP2': 'Max Fried',
    'Braves SP3': 'Charlie Morton',
    'Braves RP1': 'Raisel Iglesias',
    
    'Marlins C1': 'Nick Fortes',
    'Marlins 1B1': 'Josh Bell',
    'Marlins 2B1': 'Luis Arraez',
    'Marlins SS1': 'Tim Anderson',
    'Marlins 3B1': 'Jake Burger',
    'Marlins LF1': 'Bryan De La Cruz',
    'Marlins CF1': 'Jazz Chisholm Jr.',
    'Marlins RF1': 'Jesus Sanchez',
    'Marlins SP1': 'Sandy Alcantara',
    'Marlins SP2': 'Jesus Luzardo',
    'Marlins SP3': 'Braxton Garrett',
    'Marlins RP1': 'Tanner Scott',
    
    'Mets C1': 'Francisco Alvarez',
    'Mets 1B1': 'Pete Alonso',
    'Mets 2B1': 'Jeff McNeil',
    'Mets SS1': 'Francisco Lindor',
    'Mets 3B1': 'Brett Baty',
    'Mets LF1': 'Brandon Nimmo',
    'Mets CF1': 'Harrison Bader',
    'Mets RF1': 'Starling Marte',
    'Mets SP1': 'Kodai Senga',
    'Mets SP2': 'Jose Quintana',
    'Mets SP3': 'Luis Severino',
    'Mets RP1': 'Edwin Diaz',
    
    'Phillies C1': 'J.T. Realmuto',
    'Phillies 1B1': 'Bryce Harper',
    'Phillies 2B1': 'Bryson Stott',
    'Phillies SS1': 'Trea Turner',
    'Phillies 3B1': 'Alec Bohm',
    'Phillies LF1': 'Kyle Schwarber',
    'Phillies CF1': 'Johan Rojas',
    'Phillies RF1': 'Nick Castellanos',
    'Phillies SP1': 'Zack Wheeler',
    'Phillies SP2': 'Aaron Nola',
    'Phillies SP3': 'Ranger Suarez',
    'Phillies RP1': 'Jose Alvarado',
    
    'Nationals C1': 'Keibert Ruiz',
    'Nationals 1B1': 'Joey Meneses',
    'Nationals 2B1': 'Luis Garcia Jr.',
    'Nationals SS1': 'CJ Abrams',
    'Nationals 3B1': 'Jeimer Candelario',
    'Nationals LF1': 'Stone Garrett',
    'Nationals CF1': 'Lane Thomas',
    'Nationals RF1': 'Victor Robles',
    'Nationals SP1': 'Josiah Gray',
    'Nationals SP2': 'MacKenzie Gore',
    'Nationals SP3': 'Trevor Williams',
    'Nationals RP1': 'Hunter Harvey',
    
    // NL Central
    'Cubs C1': 'Yan Gomes',
    'Cubs 1B1': 'Cody Bellinger',
    'Cubs 2B1': 'Nico Hoerner',
    'Cubs SS1': 'Dansby Swanson',
    'Cubs 3B1': 'Christopher Morel',
    'Cubs LF1': 'Ian Happ',
    'Cubs CF1': 'Pete Crow-Armstrong',
    'Cubs RF1': 'Seiya Suzuki',
    'Cubs SP1': 'Justin Steele',
    'Cubs SP2': 'Marcus Stroman',
    'Cubs SP3': 'Jameson Taillon',
    'Cubs RP1': 'Adbert Alzolay',
    
    'Reds C1': 'Tyler Stephenson',
    'Reds 1B1': 'Spencer Steer',
    'Reds 2B1': 'Jonathan India',
    'Reds SS1': 'Elly De La Cruz',
    'Reds 3B1': 'Jeimer Candelario',
    'Reds LF1': 'Jake Fraley',
    'Reds CF1': 'TJ Friedl',
    'Reds RF1': 'Will Benson',
    'Reds SP1': 'Hunter Greene',
    'Reds SP2': 'Nick Lodolo',
    'Reds SP3': 'Graham Ashcraft',
    'Reds RP1': 'Alexis Diaz',
    
    'Brewers C1': 'William Contreras',
    'Brewers 1B1': 'Rhys Hoskins',
    'Brewers 2B1': 'Brice Turang',
    'Brewers SS1': 'Willy Adames',
    'Brewers 3B1': 'Joey Ortiz',
    'Brewers LF1': 'Christian Yelich',
    'Brewers CF1': 'Blake Perkins',
    'Brewers RF1': 'Jackson Chourio',
    'Brewers SP1': 'Corbin Burnes',
    'Brewers SP2': 'Freddy Peralta',
    'Brewers SP3': 'Brandon Woodruff',
    'Brewers RP1': 'Devin Williams',
    
    'Pirates C1': 'Henry Davis',
    'Pirates 1B1': 'Rowdy Tellez',
    'Pirates 2B1': 'Nick Gonzales',
    'Pirates SS1': 'Oneil Cruz',
    'Pirates 3B1': 'Ke\'Bryan Hayes',
    'Pirates LF1': 'Bryan Reynolds',
    'Pirates CF1': 'Jack Suwinski',
    'Pirates RF1': 'Edward Olivares',
    'Pirates SP1': 'Mitch Keller',
    'Pirates SP2': 'Jared Jones',
    'Pirates SP3': 'Bailey Falter',
    'Pirates RP1': 'David Bednar',
    
    'Cardinals C1': 'Willson Contreras',
    'Cardinals 1B1': 'Paul Goldschmidt',
    'Cardinals 2B1': 'Nolan Gorman',
    'Cardinals SS1': 'Masyn Winn',
    'Cardinals 3B1': 'Nolan Arenado',
    'Cardinals LF1': 'Brendan Donovan',
    'Cardinals CF1': 'Lars Nootbaar',
    'Cardinals RF1': 'Jordan Walker',
    'Cardinals SP1': 'Sonny Gray',
    'Cardinals SP2': 'Kyle Gibson',
    'Cardinals SP3': 'Lance Lynn',
    'Cardinals RP1': 'Ryan Helsley',
    
    // NL West
    'Diamondbacks C1': 'Gabriel Moreno',
    'Diamondbacks 1B1': 'Christian Walker',
    'Diamondbacks 2B1': 'Ketel Marte',
    'Diamondbacks SS1': 'Geraldo Perdomo',
    'Diamondbacks 3B1': 'Eugenio Suarez',
    'Diamondbacks LF1': 'Lourdes Gurriel Jr.',
    'Diamondbacks CF1': 'Alek Thomas',
    'Diamondbacks RF1': 'Corbin Carroll',
    'Diamondbacks SP1': 'Zac Gallen',
    'Diamondbacks SP2': 'Merrill Kelly',
    'Diamondbacks SP3': 'Brandon Pfaadt',
    'Diamondbacks RP1': 'Paul Sewald',
    
    'Rockies C1': 'Elias Diaz',
    'Rockies 1B1': 'Elehuris Montero',
    'Rockies 2B1': 'Brendan Rodgers',
    'Rockies SS1': 'Ezequiel Tovar',
    'Rockies 3B1': 'Ryan McMahon',
    'Rockies LF1': 'Jurickson Profar',
    'Rockies CF1': 'Brenton Doyle',
    'Rockies RF1': 'Charlie Blackmon',
    'Rockies SP1': 'Kyle Freeland',
    'Rockies SP2': 'Cal Quantrill',
    'Rockies SP3': 'Austin Gomber',
    'Rockies RP1': 'Justin Lawrence',
    
    'Dodgers C1': 'Will Smith',
    'Dodgers 1B1': 'Freddie Freeman',
    'Dodgers 2B1': 'Mookie Betts',
    'Dodgers SS1': 'Miguel Rojas',
    'Dodgers 3B1': 'Max Muncy',
    'Dodgers LF1': 'Chris Taylor',
    'Dodgers CF1': 'James Outman',
    'Dodgers RF1': 'Jason Heyward',
    'Dodgers DH1': 'Shohei Ohtani',
    'Dodgers SP1': 'Yoshinobu Yamamoto',
    'Dodgers SP2': 'Tyler Glasnow',
    'Dodgers SP3': 'Bobby Miller',
    'Dodgers RP1': 'Evan Phillips',
    
    'Padres C1': 'Luis Campusano',
    'Padres 1B1': 'Jake Cronenworth',
    'Padres 2B1': 'Xander Bogaerts',
    'Padres SS1': 'Ha-Seong Kim',
    'Padres 3B1': 'Manny Machado',
    'Padres LF1': 'Jurickson Profar',
    'Padres CF1': 'Jackson Merrill',
    'Padres RF1': 'Fernando Tatis Jr.',
    'Padres SP1': 'Joe Musgrove',
    'Padres SP2': 'Dylan Cease',
    'Padres SP3': 'Yu Darvish',
    'Padres RP1': 'Robert Suarez',
    
    'Giants C1': 'Patrick Bailey',
    'Giants 1B1': 'LaMonte Wade Jr.',
    'Giants 2B1': 'Thairo Estrada',
    'Giants SS1': 'Nick Ahmed',
    'Giants 3B1': 'Matt Chapman',
    'Giants LF1': 'Michael Conforto',
    'Giants CF1': 'Jung Hoo Lee',
    'Giants RF1': 'Mike Yastrzemski',
    'Giants SP1': 'Logan Webb',
    'Giants SP2': 'Jordan Hicks',
    'Giants SP3': 'Kyle Harrison',
    'Giants RP1': 'Camilo Doval',
  },
  
  NHL: {
    // Atlantic Division
    'Bruins C1': 'Patrice Bergeron',
    'Bruins LW1': 'Brad Marchand',
    'Bruins RW1': 'David Pastrnak',
    'Bruins D1': 'Charlie McAvoy',
    'Bruins D2': 'Hampus Lindholm',
    'Bruins G1': 'Jeremy Swayman',
    
    'Sabres C1': 'Tage Thompson',
    'Sabres LW1': 'Jeff Skinner',
    'Sabres RW1': 'Alex Tuch',
    'Sabres D1': 'Rasmus Dahlin',
    'Sabres D2': 'Owen Power',
    'Sabres G1': 'Ukko-Pekka Luukkonen',
    
    'Red Wings C1': 'Dylan Larkin',
    'Red Wings LW1': 'Lucas Raymond',
    'Red Wings RW1': 'Alex DeBrincat',
    'Red Wings D1': 'Moritz Seider',
    'Red Wings D2': 'Shayne Gostisbehere',
    'Red Wings G1': 'Ville Husso',
    
    'Panthers C1': 'Aleksander Barkov',
    'Panthers LW1': 'Matthew Tkachuk',
    'Panthers RW1': 'Sam Reinhart',
    'Panthers D1': 'Aaron Ekblad',
    'Panthers D2': 'Brandon Montour',
    'Panthers G1': 'Sergei Bobrovsky',
    
    'Canadiens C1': 'Nick Suzuki',
    'Canadiens LW1': 'Cole Caufield',
    'Canadiens RW1': 'Josh Anderson',
    'Canadiens D1': 'Mike Matheson',
    'Canadiens D2': 'David Savard',
    'Canadiens G1': 'Sam Montembeault',
    
    'Senators C1': 'Tim Stutzle',
    'Senators LW1': 'Brady Tkachuk',
    'Senators RW1': 'Claude Giroux',
    'Senators D1': 'Thomas Chabot',
    'Senators D2': 'Jakob Chychrun',
    'Senators G1': 'Joonas Korpisalo',
    
    'Lightning C1': 'Brayden Point',
    'Lightning LW1': 'Brandon Hagel',
    'Lightning RW1': 'Nikita Kucherov',
    'Lightning D1': 'Victor Hedman',
    'Lightning D2': 'Mikhail Sergachev',
    'Lightning G1': 'Andrei Vasilevskiy',
    
    'Maple Leafs C1': 'Auston Matthews',
    'Maple Leafs LW1': 'Mitch Marner',
    'Maple Leafs RW1': 'William Nylander',
    'Maple Leafs D1': 'Morgan Rielly',
    'Maple Leafs D2': 'Jake McCabe',
    'Maple Leafs G1': 'Joseph Woll',
    
    // Metropolitan Division
    'Hurricanes C1': 'Sebastian Aho',
    'Hurricanes LW1': 'Andrei Svechnikov',
    'Hurricanes RW1': 'Seth Jarvis',
    'Hurricanes D1': 'Jaccob Slavin',
    'Hurricanes D2': 'Brent Burns',
    'Hurricanes G1': 'Frederik Andersen',
    
    'Blue Jackets C1': 'Johnny Gaudreau',
    'Blue Jackets LW1': 'Patrik Laine',
    'Blue Jackets RW1': 'Kirill Marchenko',
    'Blue Jackets D1': 'Zach Werenski',
    'Blue Jackets D2': 'Ivan Provorov',
    'Blue Jackets G1': 'Elvis Merzlikins',
    
    'Devils C1': 'Jack Hughes',
    'Devils LW1': 'Jesper Bratt',
    'Devils RW1': 'Tyler Toffoli',
    'Devils D1': 'Dougie Hamilton',
    'Devils D2': 'Jonas Siegenthaler',
    'Devils G1': 'Jacob Markstrom',
    
    'Islanders C1': 'Mathew Barzal',
    'Islanders LW1': 'Anders Lee',
    'Islanders RW1': 'Kyle Palmieri',
    'Islanders D1': 'Noah Dobson',
    'Islanders D2': 'Ryan Pulock',
    'Islanders G1': 'Ilya Sorokin',
    
    'Rangers C1': 'Mika Zibanejad',
    'Rangers LW1': 'Artemi Panarin',
    'Rangers RW1': 'Alexis Lafreniere',
    'Rangers D1': 'Adam Fox',
    'Rangers D2': 'Jacob Trouba',
    'Rangers G1': 'Igor Shesterkin',
    
    'Flyers C1': 'Sean Couturier',
    'Flyers LW1': 'Joel Farabee',
    'Flyers RW1': 'Travis Konecny',
    'Flyers D1': 'Carter Hart',
    'Flyers D2': 'Travis Sanheim',
    'Flyers G1': 'Carter Hart',
    
    'Penguins C1': 'Sidney Crosby',
    'Penguins LW1': 'Jake Guentzel',
    'Penguins RW1': 'Bryan Rust',
    'Penguins D1': 'Kris Letang',
    'Penguins D2': 'Erik Karlsson',
    'Penguins G1': 'Tristan Jarry',
    
    'Capitals C1': 'Dylan Strome',
    'Capitals LW1': 'Alex Ovechkin',
    'Capitals RW1': 'T.J. Oshie',
    'Capitals D1': 'John Carlson',
    'Capitals D2': 'Rasmus Sandin',
    'Capitals G1': 'Darcy Kuemper',
    
    // Central Division
    'Coyotes C1': 'Clayton Keller',
    'Coyotes LW1': 'Nick Schmaltz',
    'Coyotes RW1': 'Logan Cooley',
    'Coyotes D1': 'Shayne Gostisbehere',
    'Coyotes D2': 'J.J. Moser',
    'Coyotes G1': 'Connor Ingram',
    
    'Blackhawks C1': 'Connor Bedard',
    'Blackhawks LW1': 'Taylor Hall',
    'Blackhawks RW1': 'Corey Perry',
    'Blackhawks D1': 'Seth Jones',
    'Blackhawks D2': 'Connor Murphy',
    'Blackhawks G1': 'Petr Mrazek',
    
    'Avalanche C1': 'Nathan MacKinnon',
    'Avalanche LW1': 'Gabriel Landeskog',
    'Avalanche RW1': 'Mikko Rantanen',
    'Avalanche D1': 'Cale Makar',
    'Avalanche D2': 'Devon Toews',
    'Avalanche G1': 'Alexandar Georgiev',
    
    'Stars C1': 'Roope Hintz',
    'Stars LW1': 'Jason Robertson',
    'Stars RW1': 'Tyler Seguin',
    'Stars D1': 'Miro Heiskanen',
    'Stars D2': 'Ryan Suter',
    'Stars G1': 'Jake Oettinger',
    
    'Wild C1': 'Kirill Kaprizov',
    'Wild LW1': 'Marcus Foligno',
    'Wild RW1': 'Mats Zuccarello',
    'Wild D1': 'Jared Spurgeon',
    'Wild D2': 'Jonas Brodin',
    'Wild G1': 'Filip Gustavsson',
    
    'Predators C1': 'Ryan O\'Reilly',
    'Predators LW1': 'Filip Forsberg',
    'Predators RW1': 'Gustav Nyquist',
    'Predators D1': 'Roman Josi',
    'Predators D2': 'Ryan McDonagh',
    'Predators G1': 'Juuse Saros',
    
    'Blues C1': 'Robert Thomas',
    'Blues LW1': 'Jordan Kyrou',
    'Blues RW1': 'Vladimir Tarasenko',
    'Blues D1': 'Colton Parayko',
    'Blues D2': 'Torey Krug',
    'Blues G1': 'Jordan Binnington',
    
    'Jets C1': 'Mark Scheifele',
    'Jets LW1': 'Kyle Connor',
    'Jets RW1': 'Nikolaj Ehlers',
    'Jets D1': 'Josh Morrissey',
    'Jets D2': 'Neal Pionk',
    'Jets G1': 'Connor Hellebuyck',
    
    // Pacific Division
    'Ducks C1': 'Trevor Zegras',
    'Ducks LW1': 'Troy Terry',
    'Ducks RW1': 'Frank Vatrano',
    'Ducks D1': 'Cam Fowler',
    'Ducks D2': 'John Klingberg',
    'Ducks G1': 'John Gibson',
    
    'Flames C1': 'Elias Lindholm',
    'Flames LW1': 'Jonathan Huberdeau',
    'Flames RW1': 'Blake Coleman',
    'Flames D1': 'Rasmus Andersson',
    'Flames D2': 'Noah Hanifin',
    'Flames G1': 'Jacob Markstrom',
    
    'Oilers C1': 'Connor McDavid',
    'Oilers LW1': 'Zach Hyman',
    'Oilers RW1': 'Leon Draisaitl',
    'Oilers D1': 'Darnell Nurse',
    'Oilers D2': 'Evan Bouchard',
    'Oilers G1': 'Stuart Skinner',
    
    'Kings C1': 'Anze Kopitar',
    'Kings LW1': 'Kevin Fiala',
    'Kings RW1': 'Adrian Kempe',
    'Kings D1': 'Drew Doughty',
    'Kings D2': 'Matt Roy',
    'Kings G1': 'Cam Talbot',
    
    'Sharks C1': 'Tomas Hertl',
    'Sharks LW1': 'Timo Meier',
    'Sharks RW1': 'Mike Hoffman',
    'Sharks D1': 'Erik Karlsson',
    'Sharks D2': 'Mario Ferraro',
    'Sharks G1': 'Kaapo Kahkonen',
    
    'Kraken C1': 'Matty Beniers',
    'Kraken LW1': 'Jared McCann',
    'Kraken RW1': 'Jordan Eberle',
    'Kraken D1': 'Vince Dunn',
    'Kraken D2': 'Adam Larsson',
    'Kraken G1': 'Philipp Grubauer',
    
    'Canucks C1': 'Elias Pettersson',
    'Canucks LW1': 'J.T. Miller',
    'Canucks RW1': 'Brock Boeser',
    'Canucks D1': 'Quinn Hughes',
    'Canucks D2': 'Filip Hronek',
    'Canucks G1': 'Thatcher Demko',
    
    'Golden Knights C1': 'Jack Eichel',
    'Golden Knights LW1': 'Jonathan Marchessault',
    'Golden Knights RW1': 'Mark Stone',
    'Golden Knights D1': 'Alex Pietrangelo',
    'Golden Knights D2': 'Shea Theodore',
    'Golden Knights G1': 'Logan Thompson',
  }
};

async function updateToRealPlayerNames() {
  console.log('🏆 STARTING REAL PLAYER NAME UPDATE!');
  console.log('Mission: Transform generic names to real athlete names');
  console.log('=======================================================');
  
  let updateCount = 0;
  let errorCount = 0;
  
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Connected to Supabase');
    
    // Process each sport
    for (const [sport, playerMappings] of Object.entries(REAL_PLAYERS)) {
      console.log(`\n🏈 Processing ${sport}...`);
      
      for (const [genericName, realName] of Object.entries(playerMappings)) {
        try {
          // Find player with the generic name
          const player = await prisma.player.findFirst({
            where: {
              name: genericName
            }
          });
          
          if (player) {
            // Update to real name
            await prisma.player.update({
              where: { id: player.id },
              data: { 
                name: realName,
                imageUrl: getPlayerImageUrl(realName, sport)
              }
            });
            
            updateCount++;
            
            if (updateCount % 100 === 0) {
              console.log(`📊 Progress: ${updateCount} players updated...`);
            }
          }
        } catch (error) {
          errorCount++;
          console.error(`❌ Error updating ${genericName}: ${error}`);
        }
      }
    }
    
    console.log('\n🎉 REAL PLAYER NAME UPDATE COMPLETE!');
    console.log('=====================================');
    console.log(`✅ Successfully updated: ${updateCount} players`);
    console.log(`❌ Errors encountered: ${errorCount}`);
    console.log(`📊 Update rate: ${((updateCount / (updateCount + errorCount)) * 100).toFixed(1)}%`);
    
    // Verify some updates
    console.log('\n🔍 Verification - Sample Updated Players:');
    const samplePlayers = await prisma.player.findMany({
      where: {
        name: {
          in: ['Josh Allen', 'Patrick Mahomes', 'LeBron James', 'Connor McDavid', 'Shohei Ohtani']
        }
      },
      select: { name: true, position: true, team: true }
    });
    
    samplePlayers.forEach(player => {
      console.log(`   ✅ ${player.name} - ${player.position} (${player.team})`);
    });
    
  } catch (error) {
    console.error('💥 Critical error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getPlayerImageUrl(playerName: string, sport: string): string {
  // Generate realistic image URLs based on player name and sport
  const cleanName = playerName.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, '-');
  
  switch(sport) {
    case 'NFL':
      return `https://a.espncdn.com/i/headshots/nfl/players/full/${cleanName}.png`;
    case 'NBA':
      return `https://a.espncdn.com/i/headshots/nba/players/full/${cleanName}.png`;
    case 'MLB':
      return `https://a.espncdn.com/i/headshots/mlb/players/full/${cleanName}.jpg`;
    case 'NHL':
      return `https://a.espncdn.com/i/headshots/nhl/players/full/${cleanName}.png`;
    default:
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&size=200`;
  }
}

// Execute the update
if (require.main === module) {
  updateToRealPlayerNames()
    .then(() => {
      console.log('\n🏆 Fantasy.AI now has REAL PLAYER NAMES!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Update failed:', error);
      process.exit(1);
    });
}

export { updateToRealPlayerNames };