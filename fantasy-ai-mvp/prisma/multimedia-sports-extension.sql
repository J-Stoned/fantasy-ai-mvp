-- 🚀 Fantasy.AI Multimedia Sports Analytics Extension
-- This extends the existing Prisma schema with revolutionary multimedia capabilities
-- Ready for direct execution in Supabase SQL Editor

-- ===== ENUMS AND TYPES =====

-- Extend Sport enum to include high school sports
CREATE TYPE "SportLevel" AS ENUM (
  'HIGH_SCHOOL',
  'COLLEGE', 
  'PROFESSIONAL',
  'YOUTH',
  'AMATEUR'
);

CREATE TYPE "MultimediaType" AS ENUM (
  'PODCAST',
  'YOUTUBE_VIDEO',
  'LIVE_STREAM',
  'SOCIAL_POST',
  'HIGHLIGHT_REEL',
  'INTERVIEW',
  'PRESS_CONFERENCE',
  'GAME_BROADCAST'
);

CREATE TYPE "ContentSentiment" AS ENUM (
  'VERY_POSITIVE',
  'POSITIVE', 
  'NEUTRAL',
  'NEGATIVE',
  'VERY_NEGATIVE'
);

CREATE TYPE "BiometricType" AS ENUM (
  'HEART_RATE',
  'SLEEP_QUALITY',
  'RECOVERY_SCORE',
  'STRAIN_LEVEL',
  'HRV',
  'BODY_TEMPERATURE',
  'HYDRATION_LEVEL'
);

CREATE TYPE "WeatherCondition" AS ENUM (
  'CLEAR',
  'CLOUDY',
  'RAINY', 
  'SNOWY',
  'WINDY',
  'EXTREME_HEAT',
  'EXTREME_COLD',
  'HUMID'
);

-- ===== HIGH SCHOOL SPORTS FOUNDATION =====

-- School Districts and Classifications
CREATE TABLE "SchoolDistrict" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "classification" TEXT NOT NULL, -- 1A, 2A, 3A, etc.
  "region" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- High Schools
CREATE TABLE "HighSchool" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "districtId" TEXT,
  "address" JSONB NOT NULL,
  "enrollment" INTEGER,
  "mascot" TEXT,
  "colors" TEXT,
  "principal" TEXT,
  "athleticDirector" TEXT,
  "website" TEXT,
  "socialMedia" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("districtId") REFERENCES "SchoolDistrict"("id") ON DELETE SET NULL
);

-- High School Teams (extends existing Team model concept)
CREATE TABLE "HighSchoolTeam" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "schoolId" TEXT NOT NULL,
  "sport" TEXT NOT NULL, -- Will reference Sport enum
  "level" "SportLevel" NOT NULL DEFAULT 'HIGH_SCHOOL',
  "division" TEXT, -- Varsity, JV, Freshman
  "season" TEXT NOT NULL, -- 2024-2025
  "conference" TEXT,
  "wins" INTEGER DEFAULT 0,
  "losses" INTEGER DEFAULT 0,
  "ties" INTEGER DEFAULT 0,
  "ranking" INTEGER,
  "coachName" TEXT,
  "coachEmail" TEXT,
  "teamStats" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("schoolId") REFERENCES "HighSchool"("id") ON DELETE CASCADE
);

-- High School Athletes
CREATE TABLE "HighSchoolAthlete" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "dateOfBirth" DATE,
  "graduationYear" INTEGER NOT NULL,
  "heightInches" INTEGER,
  "weightLbs" INTEGER,
  "primaryPosition" TEXT,
  "secondaryPositions" TEXT[],
  "jerseyNumber" INTEGER,
  "gpa" DECIMAL(3,2),
  "satScore" INTEGER,
  "actScore" INTEGER,
  "bio" TEXT,
  "accolades" JSONB,
  "parentContact" JSONB,
  "socialMedia" JSONB,
  "recruitingProfile" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Team Rosters (Many-to-Many relationship)
CREATE TABLE "TeamRoster" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "teamId" TEXT NOT NULL,
  "athleteId" TEXT NOT NULL,
  "jerseyNumber" INTEGER,
  "position" TEXT NOT NULL,
  "isCaptain" BOOLEAN DEFAULT FALSE,
  "isStarter" BOOLEAN DEFAULT FALSE,
  "seasonStats" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("teamId") REFERENCES "HighSchoolTeam"("id") ON DELETE CASCADE,
  FOREIGN KEY ("athleteId") REFERENCES "HighSchoolAthlete"("id") ON DELETE CASCADE,
  UNIQUE("teamId", "athleteId")
);

-- ===== MULTIMEDIA ANALYTICS SYSTEM =====

-- Podcast Content Analysis
CREATE TABLE "PodcastContent" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "podcastName" TEXT NOT NULL,
  "episodeNumber" INTEGER,
  "publishDate" TIMESTAMP(3) NOT NULL,
  "duration" INTEGER, -- seconds
  "audioUrl" TEXT,
  "transcriptUrl" TEXT,
  "hostNames" TEXT[],
  "guestNames" TEXT[],
  "topics" TEXT[],
  "playersDiscussed" TEXT[], -- References to player IDs
  "teamsDiscussed" TEXT[], -- References to team IDs
  "sentiment" "ContentSentiment",
  "keyInsights" JSONB,
  "injuryReports" JSONB,
  "tradeRumors" JSONB,
  "predictions" JSONB,
  "viewCount" INTEGER DEFAULT 0,
  "likeCount" INTEGER DEFAULT 0,
  "shareCount" INTEGER DEFAULT 0,
  "processingStatus" TEXT DEFAULT 'pending',
  "aiAnalysis" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- YouTube Content Analysis
CREATE TABLE "YouTubeContent" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "videoId" TEXT UNIQUE NOT NULL, -- YouTube video ID
  "title" TEXT NOT NULL,
  "description" TEXT,
  "channelName" TEXT NOT NULL,
  "channelId" TEXT NOT NULL,
  "publishDate" TIMESTAMP(3) NOT NULL,
  "duration" INTEGER, -- seconds
  "viewCount" INTEGER DEFAULT 0,
  "likeCount" INTEGER DEFAULT 0,
  "commentCount" INTEGER DEFAULT 0,
  "thumbnailUrl" TEXT,
  "videoUrl" TEXT,
  "contentType" "MultimediaType" NOT NULL,
  "sport" TEXT,
  "playersTagged" TEXT[],
  "teamsTagged" TEXT[],
  "gamesReferenced" TEXT[],
  "highlights" JSONB, -- Timestamped highlights
  "keyMoments" JSONB, -- AI-detected key moments
  "sentiment" "ContentSentiment",
  "transcription" TEXT,
  "aiAnalysis" JSONB,
  "computerVisionData" JSONB, -- Play analysis, player tracking
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Live Game Analytics
CREATE TABLE "LiveGameAnalytics" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "gameId" TEXT, -- References existing Game if available
  "homeTeamId" TEXT,
  "awayTeamId" TEXT,
  "gameDate" TIMESTAMP(3) NOT NULL,
  "venue" JSONB,
  "status" TEXT NOT NULL, -- pre_game, live, halftime, final
  "currentPeriod" INTEGER,
  "timeRemaining" TEXT,
  "liveScore" JSONB,
  "playByPlay" JSONB, -- Real-time play updates
  "playerTracking" JSONB, -- Live player position data
  "momentum" JSONB, -- Real-time momentum tracking
  "crowdSentiment" "ContentSentiment",
  "weatherConditions" "WeatherCondition",
  "temperature" INTEGER,
  "humidity" INTEGER,
  "windSpeed" INTEGER,
  "precipitation" DECIMAL(4,2),
  "refereeData" JSONB, -- Referee bias analysis
  "broadcastData" JSONB, -- TV/stream analytics
  "socialMentions" INTEGER DEFAULT 0,
  "liveViewers" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Social Media Intelligence
CREATE TABLE "SocialMediaPost" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "platform" TEXT NOT NULL, -- twitter, instagram, tiktok, reddit
  "postId" TEXT NOT NULL,
  "authorHandle" TEXT,
  "authorFollowers" INTEGER,
  "content" TEXT,
  "mediaUrls" TEXT[],
  "hashtags" TEXT[],
  "mentions" TEXT[],
  "publishDate" TIMESTAMP(3) NOT NULL,
  "likeCount" INTEGER DEFAULT 0,
  "shareCount" INTEGER DEFAULT 0,
  "commentCount" INTEGER DEFAULT 0,
  "reachEstimate" INTEGER,
  "engagementRate" DECIMAL(5,4),
  "sentiment" "ContentSentiment",
  "playersReferenced" TEXT[],
  "teamsReferenced" TEXT[],
  "topicsDetected" TEXT[],
  "influenceScore" DECIMAL(5,2),
  "viralPotential" DECIMAL(3,2),
  "aiAnalysis" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===== ADVANCED BIOMETRIC AND PERFORMANCE DATA =====

-- Biometric Data
CREATE TABLE "BiometricData" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "athleteId" TEXT NOT NULL,
  "deviceType" TEXT, -- WHOOP, Catapult, Apple Watch, etc.
  "dataType" "BiometricType" NOT NULL,
  "value" DECIMAL(10,4) NOT NULL,
  "unit" TEXT NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL,
  "context" JSONB, -- game, practice, rest day
  "accuracy" DECIMAL(3,2),
  "rawData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("athleteId") REFERENCES "HighSchoolAthlete"("id") ON DELETE CASCADE
);

-- Weather Impact Analysis
CREATE TABLE "WeatherImpact" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "gameId" TEXT,
  "location" JSONB NOT NULL,
  "gameTime" TIMESTAMP(3) NOT NULL,
  "condition" "WeatherCondition" NOT NULL,
  "temperature" INTEGER,
  "humidity" INTEGER,
  "windSpeed" INTEGER,
  "windDirection" INTEGER,
  "precipitation" DECIMAL(4,2),
  "visibility" INTEGER,
  "uvIndex" INTEGER,
  "airQuality" INTEGER,
  "performanceImpact" JSONB, -- AI analysis of weather effects
  "playerAdjustments" JSONB,
  "strategicImplications" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===== EQUIPMENT CATALOG SYSTEM =====

-- Equipment Categories
CREATE TABLE "EquipmentCategory" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "parentCategoryId" TEXT,
  "description" TEXT,
  "applicableSports" TEXT[],
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("parentCategoryId") REFERENCES "EquipmentCategory"("id") ON DELETE SET NULL
);

-- Equipment Products
CREATE TABLE "EquipmentProduct" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sku" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "brand" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "description" TEXT,
  "specifications" JSONB NOT NULL,
  "pricing" JSONB NOT NULL, -- Current price, MSRP, discounts
  "inventory" JSONB,
  "dimensions" JSONB,
  "weight" DECIMAL(8,2),
  "materials" TEXT[],
  "colors" TEXT[],
  "sizes" TEXT[],
  "certifications" TEXT[],
  "safetyRatings" JSONB,
  "performanceMetrics" JSONB,
  "userRatings" JSONB,
  "images" TEXT[],
  "videos" TEXT[],
  "supplierInfo" JSONB,
  "popularityScore" DECIMAL(5,2),
  "recommendationData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("categoryId") REFERENCES "EquipmentCategory"("id") ON DELETE CASCADE
);

-- Equipment Recommendations (AI-powered)
CREATE TABLE "EquipmentRecommendation" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "athleteId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "recommendationType" TEXT NOT NULL, -- performance, safety, budget, trending
  "confidenceScore" DECIMAL(3,2) NOT NULL,
  "reasoning" JSONB,
  "basedOnMetrics" JSONB,
  "pricePoint" TEXT,
  "urgency" TEXT, -- low, medium, high
  "seasonalRelevance" BOOLEAN DEFAULT TRUE,
  "clicked" BOOLEAN DEFAULT FALSE,
  "purchased" BOOLEAN DEFAULT FALSE,
  "feedback" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("athleteId") REFERENCES "HighSchoolAthlete"("id") ON DELETE CASCADE,
  FOREIGN KEY ("productId") REFERENCES "EquipmentProduct"("id") ON DELETE CASCADE
);

-- ===== AI TRAINING DATA PIPELINE =====

-- Training Datasets
CREATE TABLE "AITrainingDataset" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "dataType" TEXT NOT NULL, -- player_stats, game_footage, biometric, social
  "format" TEXT NOT NULL, -- csv, json, parquet, video, audio
  "version" TEXT NOT NULL,
  "sport" TEXT,
  "dataRange" JSONB, -- date ranges, seasons covered
  "recordCount" INTEGER,
  "fileSize" BIGINT,
  "storageLocation" TEXT,
  "schema" JSONB,
  "qualityMetrics" JSONB,
  "labelingStatus" TEXT,
  "trainingSplit" JSONB, -- train/validation/test splits
  "featureEngineering" JSONB,
  "modelCompatibility" TEXT[],
  "accessLevel" TEXT DEFAULT 'internal',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- AI Model Performance
CREATE TABLE "AIModelPerformance" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "modelName" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "trainingDatasetId" TEXT,
  "modelType" TEXT NOT NULL, -- prediction, classification, recommendation
  "sport" TEXT,
  "useCase" TEXT NOT NULL,
  "accuracy" DECIMAL(5,4),
  "precision" DECIMAL(5,4),
  "recall" DECIMAL(5,4),
  "f1Score" DECIMAL(5,4),
  "mse" DECIMAL(10,6),
  "mae" DECIMAL(10,6),
  "customMetrics" JSONB,
  "trainingTime" INTEGER,
  "inferenceTime" INTEGER,
  "modelSize" BIGINT,
  "deploymentStatus" TEXT,
  "benchmarkResults" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("trainingDatasetId") REFERENCES "AITrainingDataset"("id") ON DELETE SET NULL
);

-- ===== HISTORICAL ANALYTICS =====

-- Performance Trends
CREATE TABLE "PerformanceTrend" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "entityType" TEXT NOT NULL, -- player, team, school
  "entityId" TEXT NOT NULL,
  "metricName" TEXT NOT NULL,
  "timeframe" TEXT NOT NULL, -- season, month, career
  "dataPoints" JSONB NOT NULL, -- Time series data
  "trendDirection" TEXT, -- improving, declining, stable
  "trendStrength" DECIMAL(3,2),
  "seasonality" JSONB,
  "outliers" JSONB,
  "predictions" JSONB,
  "comparisonData" JSONB, -- vs peers, vs historical
  "insights" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Clutch Performance Metrics
CREATE TABLE "ClutchPerformance" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "athleteId" TEXT NOT NULL,
  "gameId" TEXT,
  "situationType" TEXT NOT NULL, -- fourth_quarter, overtime, playoff, rivalry
  "pressure" DECIMAL(3,2) NOT NULL, -- 0-1 scale
  "performanceMetrics" JSONB NOT NULL,
  "expectedMetrics" JSONB,
  "clutchScore" DECIMAL(5,2),
  "clutchRating" TEXT, -- elite, good, average, poor
  "contextFactors" JSONB,
  "historicalComparison" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("athleteId") REFERENCES "HighSchoolAthlete"("id") ON DELETE CASCADE
);

-- ===== INDEXES FOR PERFORMANCE =====

-- High-performance indexes for common queries
CREATE INDEX IF NOT EXISTS "idx_podcast_players" ON "PodcastContent" USING GIN ("playersDiscussed");
CREATE INDEX IF NOT EXISTS "idx_podcast_sentiment" ON "PodcastContent" ("sentiment");
CREATE INDEX IF NOT EXISTS "idx_podcast_publish_date" ON "PodcastContent" ("publishDate");

CREATE INDEX IF NOT EXISTS "idx_youtube_content_type" ON "YouTubeContent" ("contentType");
CREATE INDEX IF NOT EXISTS "idx_youtube_players" ON "YouTubeContent" USING GIN ("playersTagged");
CREATE INDEX IF NOT EXISTS "idx_youtube_views" ON "YouTubeContent" ("viewCount");

CREATE INDEX IF NOT EXISTS "idx_live_game_status" ON "LiveGameAnalytics" ("status");
CREATE INDEX IF NOT EXISTS "idx_live_game_date" ON "LiveGameAnalytics" ("gameDate");

CREATE INDEX IF NOT EXISTS "idx_social_platform" ON "SocialMediaPost" ("platform");
CREATE INDEX IF NOT EXISTS "idx_social_sentiment" ON "SocialMediaPost" ("sentiment");
CREATE INDEX IF NOT EXISTS "idx_social_viral" ON "SocialMediaPost" ("viralPotential");

CREATE INDEX IF NOT EXISTS "idx_biometric_athlete" ON "BiometricData" ("athleteId");
CREATE INDEX IF NOT EXISTS "idx_biometric_type" ON "BiometricData" ("dataType");
CREATE INDEX IF NOT EXISTS "idx_biometric_time" ON "BiometricData" ("recordedAt");

CREATE INDEX IF NOT EXISTS "idx_equipment_category" ON "EquipmentProduct" ("categoryId");
CREATE INDEX IF NOT EXISTS "idx_equipment_popularity" ON "EquipmentProduct" ("popularityScore");

CREATE INDEX IF NOT EXISTS "idx_team_school" ON "HighSchoolTeam" ("schoolId");
CREATE INDEX IF NOT EXISTS "idx_team_sport" ON "HighSchoolTeam" ("sport");
CREATE INDEX IF NOT EXISTS "idx_athlete_graduation" ON "HighSchoolAthlete" ("graduationYear");

-- ===== SUCCESS MESSAGE =====

-- Add a success indicator
INSERT INTO "SchoolDistrict" ("name", "state", "classification", "region") 
VALUES ('Fantasy.AI Test District', 'CA', '1A', 'West Coast') 
ON CONFLICT DO NOTHING;

-- End of Fantasy.AI Multimedia Sports Analytics Extension
-- This schema provides the foundation for revolutionary sports analytics
-- combining traditional statistics with modern multimedia intelligence.