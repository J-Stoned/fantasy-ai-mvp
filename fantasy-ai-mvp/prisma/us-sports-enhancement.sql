-- 🏀🏈⚾🏒 FANTASY.AI US SPORTS DOMINATION DATABASE
-- Complete NBA, MLB, NHL, NCAA + High School Enhancement

-- ===== ENHANCED SPORT TYPES =====

-- Add comprehensive US sports
ALTER TYPE "Sport" ADD VALUE IF NOT EXISTS 'BASKETBALL';
ALTER TYPE "Sport" ADD VALUE IF NOT EXISTS 'BASEBALL';  
ALTER TYPE "Sport" ADD VALUE IF NOT EXISTS 'HOCKEY';
ALTER TYPE "Sport" ADD VALUE IF NOT EXISTS 'SOCCER';
ALTER TYPE "Sport" ADD VALUE IF NOT EXISTS 'TENNIS';
ALTER TYPE "Sport" ADD VALUE IF NOT EXISTS 'GOLF';
ALTER TYPE "Sport" ADD VALUE IF NOT EXISTS 'WRESTLING';
ALTER TYPE "Sport" ADD VALUE IF NOT EXISTS 'TRACK_AND_FIELD';
ALTER TYPE "Sport" ADD VALUE IF NOT EXISTS 'SWIMMING';
ALTER TYPE "Sport" ADD VALUE IF NOT EXISTS 'VOLLEYBALL';

-- Enhanced sport levels
CREATE TYPE "Division" AS ENUM (
  'NBA', 'MLB', 'NHL', 'MLS',
  'NCAA_D1', 'NCAA_D2', 'NCAA_D3', 'NAIA', 'NJCAA',
  'HIGH_SCHOOL_VARSITY', 'HIGH_SCHOOL_JV', 'HIGH_SCHOOL_FRESHMAN',
  'AAU', 'TRAVEL_BALL', 'CLUB'
);

-- Season types
CREATE TYPE "SeasonType" AS ENUM (
  'PRESEASON',
  'REGULAR_SEASON', 
  'PLAYOFFS',
  'POSTSEASON',
  'CHAMPIONSHIP',
  'TOURNAMENT',
  'MARCH_MADNESS',
  'WORLD_SERIES',
  'STANLEY_CUP',
  'NBA_FINALS'
);

-- ===== PROFESSIONAL SPORTS TABLES =====

-- NBA/Basketball specific data
CREATE TABLE "BasketballPlayer" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "playerId" TEXT NOT NULL, -- References main Player table
  "position" TEXT NOT NULL, -- PG, SG, SF, PF, C
  "wingSpan" INTEGER, -- inches
  "verticalLeap" INTEGER, -- inches
  "shootingHand" TEXT, -- Left, Right, Both
  "college" TEXT,
  "draftYear" INTEGER,
  "draftRound" INTEGER,
  "draftPick" INTEGER,
  "rookie" BOOLEAN DEFAULT FALSE,
  "contract" JSONB, -- salary, years, team options
  "advancedStats" JSONB, -- PER, true shooting %, usage rate
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE
);

-- MLB/Baseball specific data
CREATE TABLE "BaseballPlayer" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "playerId" TEXT NOT NULL,
  "position" TEXT NOT NULL, -- C, 1B, 2B, 3B, SS, LF, CF, RF, P
  "battingSide" TEXT, -- Left, Right, Switch
  "throwingHand" TEXT, -- Left, Right
  "college" TEXT,
  "draftYear" INTEGER,
  "minorLeagueLevel" TEXT, -- AAA, AA, A+, A, Rookie
  "forty40Speed" DECIMAL(4,2), -- 40-yard dash equivalent
  "exitVelocity" INTEGER, -- mph
  "launchAngle" DECIMAL(4,1),
  "contract" JSONB,
  "advancedStats" JSONB, -- OPS+, wRC+, FIP, xERA
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE
);

-- NHL/Hockey specific data  
CREATE TABLE "HockeyPlayer" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "playerId" TEXT NOT NULL,
  "position" TEXT NOT NULL, -- C, LW, RW, D, G
  "shootsHandedness" TEXT, -- Left, Right
  "college" TEXT,
  "draftYear" INTEGER,
  "draftRound" INTEGER,
  "draftPick" INTEGER,
  "nationality" TEXT,
  "previousLeague" TEXT, -- CHL, NCAA, European leagues
  "contract" JSONB,
  "advancedStats" JSONB, -- Corsi, Fenwick, PDO, xGF%
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE
);

-- ===== NCAA COLLEGE SPORTS =====

-- Enhanced college/university data
CREATE TABLE "College" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "nickname" TEXT, -- Mascot name
  "abbreviation" TEXT,
  "conference" TEXT NOT NULL,
  "division" "Division" NOT NULL,
  "location" JSONB NOT NULL, -- city, state, coordinates
  "enrollment" INTEGER,
  "athleticBudget" BIGINT,
  "facilities" JSONB,
  "coachingStaff" JSONB,
  "academicRanking" INTEGER,
  "athleticRanking" JSONB, -- by sport
  "recruitingClass" JSONB,
  "socialMedia" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- College teams (sport-specific)
CREATE TABLE "CollegeTeam" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "collegeId" TEXT NOT NULL,
  "sport" "Sport" NOT NULL,
  "division" "Division" NOT NULL,
  "conference" TEXT NOT NULL,
  "season" TEXT NOT NULL,
  "headCoach" TEXT,
  "assistantCoaches" TEXT[],
  "wins" INTEGER DEFAULT 0,
  "losses" INTEGER DEFAULT 0,
  "ties" INTEGER DEFAULT 0,
  "conferenceWins" INTEGER DEFAULT 0,
  "conferenceLosses" INTEGER DEFAULT 0,
  "ranking" INTEGER,
  "conferenceRanking" INTEGER,
  "rpi" DECIMAL(4,3), -- Rating Percentage Index
  "strengthOfSchedule" DECIMAL(4,3),
  "teamStats" JSONB,
  "recruitingClass" JSONB,
  "transferPortal" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE
);

-- College athletes (enhanced from high school)
CREATE TABLE "CollegeAthlete" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "collegeId" TEXT NOT NULL,
  "sport" "Sport" NOT NULL,
  "position" TEXT NOT NULL,
  "classYear" TEXT NOT NULL, -- Freshman, Sophomore, Junior, Senior, Graduate
  "eligibilityYears" INTEGER,
  "redshirted" BOOLEAN DEFAULT FALSE,
  "transferPortal" BOOLEAN DEFAULT FALSE,
  "previousSchool" TEXT,
  "hometown" JSONB,
  "highSchoolId" TEXT, -- Link to high school data
  "recruitingRanking" INTEGER,
  "scholarshipType" TEXT, -- Full, Partial, Walk-on
  "major" TEXT,
  "gpa" DECIMAL(3,2),
  "physicalMeasurements" JSONB,
  "careerStats" JSONB,
  "seasonStats" JSONB,
  "awards" JSONB,
  "draftEligible" BOOLEAN DEFAULT FALSE,
  "proProspect" BOOLEAN DEFAULT FALSE,
  "socialMedia" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE,
  FOREIGN KEY ("highSchoolId") REFERENCES "HighSchool"("id") ON DELETE SET NULL
);

-- ===== MARCH MADNESS & TOURNAMENT SYSTEM =====

-- Tournament/bracket system
CREATE TABLE "Tournament" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "sport" "Sport" NOT NULL,
  "division" "Division" NOT NULL,
  "season" TEXT NOT NULL,
  "tournamentType" "SeasonType" NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "teams" INTEGER NOT NULL,
  "bracket" JSONB, -- Complete bracket structure
  "selection" JSONB, -- Selection criteria and committee
  "location" JSONB,
  "prizePool" BIGINT,
  "sponsor" TEXT,
  "tvSchedule" JSONB,
  "attendance" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tournament participants
CREATE TABLE "TournamentParticipant" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tournamentId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL, -- Could be college or high school team
  "seed" INTEGER,
  "region" TEXT, -- For March Madness regions
  "autoQualifier" BOOLEAN DEFAULT FALSE,
  "atLarge" BOOLEAN DEFAULT FALSE,
  "eliminated" BOOLEAN DEFAULT FALSE,
  "eliminatedRound" TEXT,
  "finalPosition" INTEGER,
  "gamesPlayed" INTEGER DEFAULT 0,
  "wins" INTEGER DEFAULT 0,
  "losses" INTEGER DEFAULT 0,
  "stats" JSONB,
  FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE
);

-- ===== RECRUITING AND TRANSFER PORTAL =====

-- Recruiting system
CREATE TABLE "RecruitingProfile" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "athleteId" TEXT NOT NULL, -- High school athlete
  "sport" "Sport" NOT NULL,
  "classYear" INTEGER NOT NULL, -- Graduation year
  "nationalRanking" INTEGER,
  "positionRanking" INTEGER,
  "stateRanking" INTEGER,
  "rating" INTEGER, -- Star rating (1-5)
  "offers" JSONB, -- College offers received
  "visits" JSONB, -- Official/unofficial visits
  "commitment" TEXT, -- Committed college
  "commitmentDate" DATE,
  "signedNLI" BOOLEAN DEFAULT FALSE, -- National Letter of Intent
  "highlights" JSONB, -- Video highlights
  "measurements" JSONB,
  "testScores" JSONB, -- SAT, ACT
  "socialMedia" JSONB,
  "recruitingNotes" TEXT,
  "scoutingReport" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("athleteId") REFERENCES "HighSchoolAthlete"("id") ON DELETE CASCADE
);

-- Transfer portal tracking
CREATE TABLE "TransferPortal" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "athleteId" TEXT NOT NULL,
  "previousSchool" TEXT NOT NULL,
  "sport" "Sport" NOT NULL,
  "entryDate" DATE NOT NULL,
  "reason" TEXT,
  "eligibilityYears" INTEGER,
  "graduateTransfer" BOOLEAN DEFAULT FALSE,
  "newSchool" TEXT,
  "transferDate" DATE,
  "waiver" BOOLEAN DEFAULT FALSE,
  "waiverApproved" BOOLEAN,
  "interests" TEXT[], -- Schools showing interest
  "stats" JSONB, -- Previous performance
  "notes" TEXT,
  FOREIGN KEY ("athleteId") REFERENCES "CollegeAthlete"("id") ON DELETE CASCADE
);

-- ===== ADVANCED ANALYTICS TABLES =====

-- Cross-sport performance metrics
CREATE TABLE "AdvancedMetrics" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "entityType" TEXT NOT NULL, -- player, team, game
  "entityId" TEXT NOT NULL,
  "sport" "Sport" NOT NULL,
  "metricType" TEXT NOT NULL,
  "metricName" TEXT NOT NULL,
  "value" DECIMAL(10,4) NOT NULL,
  "percentile" INTEGER,
  "leagueAverage" DECIMAL(10,4),
  "seasonHigh" DECIMAL(10,4),
  "seasonLow" DECIMAL(10,4),
  "context" JSONB, -- game situation, opponent strength
  "dateRecorded" DATE NOT NULL,
  "season" TEXT NOT NULL,
  "verified" BOOLEAN DEFAULT TRUE,
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Injury tracking across all sports
CREATE TABLE "InjuryReport" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "athleteId" TEXT NOT NULL,
  "sport" "Sport" NOT NULL,
  "injuryType" TEXT NOT NULL,
  "bodyPart" TEXT NOT NULL,
  "severity" TEXT NOT NULL, -- Minor, Moderate, Major, Season-ending
  "status" TEXT NOT NULL, -- Injured, Questionable, Probable, Out, Return
  "dateInjured" DATE,
  "expectedReturn" DATE,
  "actualReturn" DATE,
  "gamesmissed" INTEGER DEFAULT 0,
  "description" TEXT,
  "treatment" TEXT,
  "impact" JSONB, -- Fantasy impact, team impact
  "source" TEXT, -- Official, Media, Social
  "verified" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===== MOBILE APP SUPPORT TABLES =====

-- User preferences for mobile
CREATE TABLE "MobileUserPreferences" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "voiceEnabled" BOOLEAN DEFAULT TRUE,
  "voiceLanguage" TEXT DEFAULT 'en-US',
  "pushNotifications" BOOLEAN DEFAULT TRUE,
  "biometricAuth" BOOLEAN DEFAULT FALSE,
  "preferredSports" "Sport"[],
  "homeScreen" JSONB, -- Custom dashboard layout
  "alertSettings" JSONB,
  "dataUsage" JSONB, -- WiFi vs cellular preferences
  "accessibility" JSONB,
  "privacy" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- AR (Augmented Reality) features
CREATE TABLE "ARExperience" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "gameId" TEXT,
  "experienceType" TEXT NOT NULL, -- live_overlay, player_stats, lineup_view
  "sessionDuration" INTEGER, -- seconds
  "interactions" JSONB,
  "accuracy" DECIMAL(3,2), -- AR tracking accuracy
  "feedback" JSONB,
  "device" TEXT, -- iPhone, Android, etc.
  "location" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- ===== INDEXES FOR PERFORMANCE =====

-- High-performance indexes for mobile app queries
CREATE INDEX IF NOT EXISTS "idx_basketball_player_position" ON "BasketballPlayer" ("position");
CREATE INDEX IF NOT EXISTS "idx_baseball_player_position" ON "BaseballPlayer" ("position");
CREATE INDEX IF NOT EXISTS "idx_hockey_player_position" ON "HockeyPlayer" ("position");

CREATE INDEX IF NOT EXISTS "idx_college_conference" ON "College" ("conference");
CREATE INDEX IF NOT EXISTS "idx_college_team_sport_season" ON "CollegeTeam" ("sport", "season");
CREATE INDEX IF NOT EXISTS "idx_college_athlete_sport_class" ON "CollegeAthlete" ("sport", "classYear");

CREATE INDEX IF NOT EXISTS "idx_recruiting_class_year" ON "RecruitingProfile" ("classYear");
CREATE INDEX IF NOT EXISTS "idx_recruiting_rating" ON "RecruitingProfile" ("rating");
CREATE INDEX IF NOT EXISTS "idx_transfer_portal_date" ON "TransferPortal" ("entryDate");

CREATE INDEX IF NOT EXISTS "idx_advanced_metrics_entity" ON "AdvancedMetrics" ("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "idx_advanced_metrics_sport" ON "AdvancedMetrics" ("sport");
CREATE INDEX IF NOT EXISTS "idx_injury_report_status" ON "InjuryReport" ("status");
CREATE INDEX IF NOT EXISTS "idx_injury_report_sport" ON "InjuryReport" ("sport");

CREATE INDEX IF NOT EXISTS "idx_tournament_sport_season" ON "Tournament" ("sport", "season");
CREATE INDEX IF NOT EXISTS "idx_tournament_participant_seed" ON "TournamentParticipant" ("seed");

-- ===== SAMPLE DATA FOR TESTING =====

-- Insert sample colleges
INSERT INTO "College" ("name", "nickname", "abbreviation", "conference", "division", "location", "enrollment") VALUES
('Duke University', 'Blue Devils', 'DUKE', 'ACC', 'NCAA_D1', '{"city": "Durham", "state": "NC"}', 15000),
('University of Kentucky', 'Wildcats', 'UK', 'SEC', 'NCAA_D1', '{"city": "Lexington", "state": "KY"}', 30000),
('Gonzaga University', 'Bulldogs', 'GONZ', 'WCC', 'NCAA_D1', '{"city": "Spokane", "state": "WA"}', 7500),
('University of Connecticut', 'Huskies', 'UCONN', 'Big East', 'NCAA_D1', '{"city": "Storrs", "state": "CT"}', 32000);

-- Success confirmation
INSERT INTO "SchoolDistrict" ("name", "state", "classification", "region") 
VALUES ('US Sports Complete District', 'USA', 'ALL', 'National') 
ON CONFLICT DO NOTHING;

-- End of US Sports Enhancement
-- Fantasy.AI now has complete coverage of NBA, MLB, NHL, NCAA + High School!
-- Ready for mobile app domination! 🏀⚾🏒🏈