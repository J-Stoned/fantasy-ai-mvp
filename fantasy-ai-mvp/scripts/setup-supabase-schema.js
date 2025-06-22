const { Client } = require('pg');

// Database connection configuration
const connectionString = "postgresql://postgres:rfoYfhORq9Y8fkLo@db.jhfhsbqrdblytrlrconc.supabase.co:5432/postgres";

async function setupDatabase() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
      require: true
    }
  });

  try {
    console.log('🚀 Connecting to Supabase database...');
    console.log('🔧 Connection config:', {
      host: 'db.jhfhsbqrdblytrlrconc.supabase.co',
      port: 5432,
      database: 'postgres',
      ssl: 'enabled'
    });
    await client.connect();
    console.log('✅ Connected successfully!');

    // Start transaction
    await client.query('BEGIN');

    console.log('📦 Creating database schema...');

    // Create all tables in order (respecting foreign key dependencies)
    
    // 1. User table (no dependencies)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        image TEXT,
        password TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created User table');

    // 2. Subscription table (depends on User)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Subscription" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        tier TEXT DEFAULT 'FREE',
        status TEXT DEFAULT 'ACTIVE',
        "startDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "endDate" TIMESTAMP,
        "stripeCustomerId" TEXT,
        "stripeSubscriptionId" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created Subscription table');

    // 3. League table (depends on User)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "League" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        name TEXT NOT NULL,
        season TEXT NOT NULL,
        sport TEXT DEFAULT 'FOOTBALL',
        "isActive" BOOLEAN DEFAULT true,
        settings TEXT NOT NULL,
        "lastSync" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "wageringEnabled" BOOLEAN DEFAULT false,
        UNIQUE(provider, "providerId")
      )
    `);
    console.log('✅ Created League table');

    // 4. WageringSettings table (depends on League)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "WageringSettings" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "leagueId" TEXT UNIQUE NOT NULL REFERENCES "League"(id) ON DELETE CASCADE,
        "enablePlayerTrading" BOOLEAN DEFAULT true,
        "enableLiveBetting" BOOLEAN DEFAULT false,
        "enableBounties" BOOLEAN DEFAULT true,
        "enablePropBets" BOOLEAN DEFAULT false,
        "enableCrypto" BOOLEAN DEFAULT false,
        "minWagerAmount" FLOAT DEFAULT 5.0,
        "maxWagerAmount" FLOAT DEFAULT 1000.0,
        "maxDailyWagerTotal" FLOAT DEFAULT 5000.0,
        "requireCommissionerApproval" BOOLEAN DEFAULT false,
        "allowGuestBetting" BOOLEAN DEFAULT false,
        "blockedMembers" TEXT DEFAULT '[]',
        "wageringAdmins" TEXT DEFAULT '[]',
        "allowCrossLeagueBetting" BOOLEAN DEFAULT false,
        "profitSharingPercent" FLOAT DEFAULT 0.0,
        "escrowHoldDays" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created WageringSettings table');

    // 5. MemberWageringOptIn table (depends on User and WageringSettings)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "MemberWageringOptIn" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "wageringSettingsId" TEXT NOT NULL REFERENCES "WageringSettings"(id) ON DELETE CASCADE,
        "optedIn" BOOLEAN DEFAULT false,
        "dailyLimit" FLOAT,
        "weeklyLimit" FLOAT,
        "allowLiveBetting" BOOLEAN DEFAULT true,
        "allowPlayerTrades" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "wageringSettingsId")
      )
    `);
    console.log('✅ Created MemberWageringOptIn table');

    // 6. Team table (depends on User and League)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Team" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "leagueId" TEXT NOT NULL REFERENCES "League"(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        rank INTEGER DEFAULT 0,
        points FLOAT DEFAULT 0,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        ties INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created Team table');

    // 7. Player table (depends on League)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Player" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "externalId" TEXT NOT NULL,
        name TEXT NOT NULL,
        position TEXT NOT NULL,
        team TEXT NOT NULL,
        "leagueId" TEXT NOT NULL REFERENCES "League"(id) ON DELETE CASCADE,
        stats TEXT NOT NULL,
        projections TEXT,
        "injuryStatus" TEXT,
        "imageUrl" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("externalId", "leagueId")
      )
    `);
    console.log('✅ Created Player table');

    // 8. Roster table (depends on Team and Player)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Roster" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "teamId" TEXT NOT NULL REFERENCES "Team"(id) ON DELETE CASCADE,
        "playerId" TEXT NOT NULL REFERENCES "Player"(id) ON DELETE CASCADE,
        position TEXT NOT NULL,
        "isStarter" BOOLEAN DEFAULT true,
        week INTEGER,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("teamId", "playerId", week)
      )
    `);
    console.log('✅ Created Roster table');

    // 9. Prediction table (depends on User and Player)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Prediction" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "playerId" TEXT NOT NULL REFERENCES "Player"(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        week INTEGER NOT NULL,
        season TEXT NOT NULL,
        prediction TEXT NOT NULL,
        confidence FLOAT NOT NULL,
        actual TEXT,
        accuracy FLOAT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created Prediction table');

    // 10. Alert table (depends on User)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Alert" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        read BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created Alert table');

    // 11. UserPreferences table (depends on User)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "UserPreferences" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        notifications TEXT DEFAULT '{}',
        theme TEXT DEFAULT 'dark',
        "aiPersonality" TEXT DEFAULT 'professional',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created UserPreferences table');

    // 12. UserSubscription table (depends on User)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "UserSubscription" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        tier TEXT NOT NULL,
        status TEXT NOT NULL,
        "billingInterval" TEXT NOT NULL,
        "currentPeriodStart" TIMESTAMP NOT NULL,
        "currentPeriodEnd" TIMESTAMP NOT NULL,
        "cancelAtPeriodEnd" BOOLEAN DEFAULT false,
        "stripeSubscriptionId" TEXT,
        "stripeCustomerId" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "UserSubscription_userId_idx" ON "UserSubscription"("userId")');
    console.log('✅ Created UserSubscription table');

    // 13. SubscriptionUsage table (composite primary key, no foreign keys)
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscription_usage (
        "userId" TEXT NOT NULL,
        period TEXT NOT NULL,
        "aiInsightsUsed" INTEGER DEFAULT 0,
        "voiceMinutesUsed" INTEGER DEFAULT 0,
        "leaguesCreated" INTEGER DEFAULT 0,
        "apiCallsMade" INTEGER DEFAULT 0,
        "lastUpdated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY ("userId", period)
      )
    `);
    console.log('✅ Created SubscriptionUsage table');

    // 14. EscrowAccount table (depends on User)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "EscrowAccount" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "totalAmount" FLOAT NOT NULL,
        "creatorAmount" FLOAT NOT NULL,
        "opponentAmount" FLOAT NOT NULL,
        status TEXT DEFAULT 'ACTIVE',
        "stripePaymentIntentId" TEXT,
        "releasedAt" TIMESTAMP,
        "releasedToId" TEXT REFERENCES "User"(id),
        "refundedAt" TIMESTAMP,
        metadata TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "EscrowAccount_status_idx" ON "EscrowAccount"(status)');
    console.log('✅ Created EscrowAccount table');

    // 15. Wager table (depends on User, League, and EscrowAccount)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Wager" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "creatorId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "opponentId" TEXT REFERENCES "User"(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'OPEN',
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        "totalValue" FLOAT NOT NULL,
        "creatorStake" FLOAT NOT NULL,
        "opponentStake" FLOAT NOT NULL,
        performance TEXT NOT NULL,
        timeframe TEXT NOT NULL,
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP NOT NULL,
        "settledAt" TIMESTAMP,
        "winnerId" TEXT REFERENCES "User"(id),
        "escrowId" TEXT UNIQUE NOT NULL REFERENCES "EscrowAccount"(id) ON DELETE CASCADE,
        "leagueId" TEXT REFERENCES "League"(id),
        "isPublic" BOOLEAN DEFAULT true,
        metadata TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "Wager_creatorId_idx" ON "Wager"("creatorId")');
    await client.query('CREATE INDEX IF NOT EXISTS "Wager_opponentId_idx" ON "Wager"("opponentId")');
    await client.query('CREATE INDEX IF NOT EXISTS "Wager_status_idx" ON "Wager"(status)');
    await client.query('CREATE INDEX IF NOT EXISTS "Wager_type_idx" ON "Wager"(type)');
    console.log('✅ Created Wager table');

    // 16. WagerPlayer table (depends on Wager and Player)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "WagerPlayer" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "wagerId" TEXT NOT NULL REFERENCES "Wager"(id) ON DELETE CASCADE,
        "playerId" TEXT NOT NULL REFERENCES "Player"(id) ON DELETE CASCADE,
        side TEXT NOT NULL,
        "stockPrice" FLOAT NOT NULL,
        "currentValue" FLOAT NOT NULL,
        "isTraded" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("wagerId", "playerId", side)
      )
    `);
    console.log('✅ Created WagerPlayer table');

    // 17. EscrowTransaction table (depends on User and EscrowAccount)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "EscrowTransaction" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "escrowId" TEXT NOT NULL REFERENCES "EscrowAccount"(id) ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        amount FLOAT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        "stripeTransactionId" TEXT,
        description TEXT NOT NULL,
        "processedAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "EscrowTransaction_userId_idx" ON "EscrowTransaction"("userId")');
    await client.query('CREATE INDEX IF NOT EXISTS "EscrowTransaction_type_idx" ON "EscrowTransaction"(type)');
    await client.query('CREATE INDEX IF NOT EXISTS "EscrowTransaction_status_idx" ON "EscrowTransaction"(status)');
    console.log('✅ Created EscrowTransaction table');

    // 18. Bounty table (depends on User, League, and EscrowAccount)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Bounty" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "creatorId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        "bountyAmount" FLOAT NOT NULL,
        "targetMetric" TEXT NOT NULL,
        timeframe TEXT NOT NULL,
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP NOT NULL,
        status TEXT DEFAULT 'OPEN',
        "maxParticipants" INTEGER DEFAULT 1,
        "isPublic" BOOLEAN DEFAULT true,
        "escrowId" TEXT UNIQUE NOT NULL REFERENCES "EscrowAccount"(id) ON DELETE CASCADE,
        "winnerId" TEXT REFERENCES "User"(id),
        "settledAt" TIMESTAMP,
        "leagueId" TEXT REFERENCES "League"(id),
        metadata TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "Bounty_creatorId_idx" ON "Bounty"("creatorId")');
    await client.query('CREATE INDEX IF NOT EXISTS "Bounty_status_idx" ON "Bounty"(status)');
    await client.query('CREATE INDEX IF NOT EXISTS "Bounty_bountyAmount_idx" ON "Bounty"("bountyAmount")');
    console.log('✅ Created Bounty table');

    // 19. BountyParticipant table (depends on Bounty and User)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "BountyParticipant" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "bountyId" TEXT NOT NULL REFERENCES "Bounty"(id) ON DELETE CASCADE,
        "participantId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "stakeAmount" FLOAT NOT NULL,
        "currentScore" FLOAT DEFAULT 0,
        "joinedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("bountyId", "participantId")
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "BountyParticipant_participantId_idx" ON "BountyParticipant"("participantId")');
    console.log('✅ Created BountyParticipant table');

    // 20. WagerUpdate table (depends on Wager)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "WagerUpdate" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "wagerId" TEXT NOT NULL REFERENCES "Wager"(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "WagerUpdate_wagerId_idx" ON "WagerUpdate"("wagerId")');
    await client.query('CREATE INDEX IF NOT EXISTS "WagerUpdate_type_idx" ON "WagerUpdate"(type)');
    console.log('✅ Created WagerUpdate table');

    // 21. BountyUpdate table (depends on Bounty)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "BountyUpdate" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "bountyId" TEXT NOT NULL REFERENCES "Bounty"(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "BountyUpdate_bountyId_idx" ON "BountyUpdate"("bountyId")');
    await client.query('CREATE INDEX IF NOT EXISTS "BountyUpdate_type_idx" ON "BountyUpdate"(type)');
    console.log('✅ Created BountyUpdate table');

    // 22. UserWallet table (depends on User)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "UserWallet" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        balance FLOAT DEFAULT 0,
        "lockedAmount" FLOAT DEFAULT 0,
        "stripeCustomerId" TEXT,
        "defaultPaymentMethodId" TEXT,
        "totalDeposited" FLOAT DEFAULT 0,
        "totalWithdrawn" FLOAT DEFAULT 0,
        "totalWon" FLOAT DEFAULT 0,
        "totalLost" FLOAT DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created UserWallet table');

    // 23. ValueSnapshot table (depends on Player)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ValueSnapshot" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "playerId" TEXT NOT NULL REFERENCES "Player"(id) ON DELETE CASCADE,
        "stockPrice" FLOAT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "wagerId" TEXT,
        metadata TEXT
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "ValueSnapshot_playerId_idx" ON "ValueSnapshot"("playerId")');
    await client.query('CREATE INDEX IF NOT EXISTS "ValueSnapshot_timestamp_idx" ON "ValueSnapshot"(timestamp)');
    console.log('✅ Created ValueSnapshot table');

    // 24. Contest table (no dependencies)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Contest" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        sport TEXT DEFAULT 'FOOTBALL',
        "contestType" TEXT NOT NULL,
        "entryFee" FLOAT NOT NULL,
        "totalPrizePool" FLOAT NOT NULL,
        "maxEntries" INTEGER NOT NULL,
        "currentEntries" INTEGER DEFAULT 0,
        "salaryCap" FLOAT DEFAULT 50000,
        "startTime" TIMESTAMP NOT NULL,
        "endTime" TIMESTAMP NOT NULL,
        status TEXT DEFAULT 'UPCOMING',
        "isPublic" BOOLEAN DEFAULT true,
        "isGuaranteed" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "Contest_sport_idx" ON "Contest"(sport)');
    await client.query('CREATE INDEX IF NOT EXISTS "Contest_contestType_idx" ON "Contest"("contestType")');
    await client.query('CREATE INDEX IF NOT EXISTS "Contest_status_idx" ON "Contest"(status)');
    await client.query('CREATE INDEX IF NOT EXISTS "Contest_startTime_idx" ON "Contest"("startTime")');
    console.log('✅ Created Contest table');

    // 25. DFSLineup table (depends on User and Contest)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "DFSLineup" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "contestId" TEXT NOT NULL REFERENCES "Contest"(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        "totalSalary" FLOAT NOT NULL,
        "totalPoints" FLOAT DEFAULT 0,
        "isOptimal" BOOLEAN DEFAULT false,
        "isLocked" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "DFSLineup_userId_idx" ON "DFSLineup"("userId")');
    await client.query('CREATE INDEX IF NOT EXISTS "DFSLineup_contestId_idx" ON "DFSLineup"("contestId")');
    await client.query('CREATE INDEX IF NOT EXISTS "DFSLineup_totalPoints_idx" ON "DFSLineup"("totalPoints")');
    console.log('✅ Created DFSLineup table');

    // 26. ContestEntry table (depends on Contest, User, and DFSLineup)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ContestEntry" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "contestId" TEXT NOT NULL REFERENCES "Contest"(id) ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "lineupId" TEXT UNIQUE NOT NULL REFERENCES "DFSLineup"(id) ON DELETE CASCADE,
        "entryNumber" INTEGER NOT NULL,
        "totalPoints" FLOAT DEFAULT 0,
        rank INTEGER,
        payout FLOAT DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("contestId", "userId", "entryNumber")
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "ContestEntry_contestId_idx" ON "ContestEntry"("contestId")');
    await client.query('CREATE INDEX IF NOT EXISTS "ContestEntry_userId_idx" ON "ContestEntry"("userId")');
    await client.query('CREATE INDEX IF NOT EXISTS "ContestEntry_totalPoints_idx" ON "ContestEntry"("totalPoints")');
    console.log('✅ Created ContestEntry table');

    // 27. DFSPlayer table (depends on Contest)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "DFSPlayer" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "contestId" TEXT NOT NULL REFERENCES "Contest"(id) ON DELETE CASCADE,
        "externalPlayerId" TEXT NOT NULL,
        name TEXT NOT NULL,
        team TEXT NOT NULL,
        position TEXT NOT NULL,
        salary FLOAT NOT NULL,
        "projectedPoints" FLOAT NOT NULL,
        "actualPoints" FLOAT DEFAULT 0,
        ownership FLOAT DEFAULT 0,
        value FLOAT DEFAULT 0,
        "gameTime" TIMESTAMP,
        "isActive" BOOLEAN DEFAULT true,
        "injuryStatus" TEXT,
        UNIQUE("contestId", "externalPlayerId")
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "DFSPlayer_contestId_idx" ON "DFSPlayer"("contestId")');
    await client.query('CREATE INDEX IF NOT EXISTS "DFSPlayer_position_idx" ON "DFSPlayer"(position)');
    await client.query('CREATE INDEX IF NOT EXISTS "DFSPlayer_salary_idx" ON "DFSPlayer"(salary)');
    await client.query('CREATE INDEX IF NOT EXISTS "DFSPlayer_projectedPoints_idx" ON "DFSPlayer"("projectedPoints")');
    console.log('✅ Created DFSPlayer table');

    // 28. DFSLineupPlayer table (depends on DFSLineup and DFSPlayer)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "DFSLineupPlayer" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "lineupId" TEXT NOT NULL REFERENCES "DFSLineup"(id) ON DELETE CASCADE,
        "dfsPlayerId" TEXT NOT NULL REFERENCES "DFSPlayer"(id) ON DELETE CASCADE,
        position TEXT NOT NULL,
        "slotPosition" TEXT NOT NULL,
        salary FLOAT NOT NULL,
        points FLOAT DEFAULT 0,
        UNIQUE("lineupId", "slotPosition")
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "DFSLineupPlayer_lineupId_idx" ON "DFSLineupPlayer"("lineupId")');
    await client.query('CREATE INDEX IF NOT EXISTS "DFSLineupPlayer_dfsPlayerId_idx" ON "DFSLineupPlayer"("dfsPlayerId")');
    console.log('✅ Created DFSLineupPlayer table');

    // 29. ContestResult table (depends on Contest, User, and ContestEntry)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ContestResult" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "contestId" TEXT NOT NULL REFERENCES "Contest"(id) ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "entryId" TEXT NOT NULL REFERENCES "ContestEntry"(id) ON DELETE CASCADE,
        "finalRank" INTEGER NOT NULL,
        "finalPoints" FLOAT NOT NULL,
        payout FLOAT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("contestId", "entryId")
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "ContestResult_contestId_idx" ON "ContestResult"("contestId")');
    await client.query('CREATE INDEX IF NOT EXISTS "ContestResult_userId_idx" ON "ContestResult"("userId")');
    await client.query('CREATE INDEX IF NOT EXISTS "ContestResult_finalRank_idx" ON "ContestResult"("finalRank")');
    console.log('✅ Created ContestResult table');

    // 30. Draft table (depends on User and League)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Draft" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "creatorId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "leagueId" TEXT REFERENCES "League"(id),
        name TEXT NOT NULL,
        description TEXT,
        sport TEXT DEFAULT 'FOOTBALL',
        "draftType" TEXT NOT NULL,
        "draftOrder" TEXT DEFAULT 'STANDARD',
        "totalRounds" INTEGER DEFAULT 15,
        "timePerPick" INTEGER DEFAULT 90,
        "isAuction" BOOLEAN DEFAULT false,
        "auctionBudget" FLOAT,
        "isSnakeDraft" BOOLEAN DEFAULT true,
        "isMockDraft" BOOLEAN DEFAULT false,
        "isPublic" BOOLEAN DEFAULT true,
        "maxParticipants" INTEGER DEFAULT 12,
        "scheduledStart" TIMESTAMP,
        "actualStart" TIMESTAMP,
        "endedAt" TIMESTAMP,
        status TEXT DEFAULT 'SCHEDULED',
        "currentRound" INTEGER DEFAULT 1,
        "currentPick" INTEGER DEFAULT 1,
        "currentPickerId" TEXT,
        settings TEXT DEFAULT '{}',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "Draft_sport_idx" ON "Draft"(sport)');
    await client.query('CREATE INDEX IF NOT EXISTS "Draft_draftType_idx" ON "Draft"("draftType")');
    await client.query('CREATE INDEX IF NOT EXISTS "Draft_status_idx" ON "Draft"(status)');
    await client.query('CREATE INDEX IF NOT EXISTS "Draft_scheduledStart_idx" ON "Draft"("scheduledStart")');
    console.log('✅ Created Draft table');

    // 31. DraftParticipant table (depends on Draft and User)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "DraftParticipant" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "draftId" TEXT NOT NULL REFERENCES "Draft"(id) ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "draftPosition" INTEGER NOT NULL,
        "teamName" TEXT,
        "isReady" BOOLEAN DEFAULT false,
        "isAutoPick" BOOLEAN DEFAULT false,
        timeouts INTEGER DEFAULT 3,
        "totalSpent" FLOAT DEFAULT 0,
        "joinedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("draftId", "userId"),
        UNIQUE("draftId", "draftPosition")
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "DraftParticipant_draftId_idx" ON "DraftParticipant"("draftId")');
    await client.query('CREATE INDEX IF NOT EXISTS "DraftParticipant_userId_idx" ON "DraftParticipant"("userId")');
    console.log('✅ Created DraftParticipant table');

    // 32. DraftPick table (depends on Draft, DraftParticipant, and User)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "DraftPick" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "draftId" TEXT NOT NULL REFERENCES "Draft"(id) ON DELETE CASCADE,
        "participantId" TEXT NOT NULL REFERENCES "DraftParticipant"(id) ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "playerId" TEXT NOT NULL,
        "playerName" TEXT NOT NULL,
        "playerPosition" TEXT NOT NULL,
        "playerTeam" TEXT NOT NULL,
        round INTEGER NOT NULL,
        pick INTEGER NOT NULL,
        "pickInRound" INTEGER NOT NULL,
        "auctionPrice" FLOAT,
        "isKeeper" BOOLEAN DEFAULT false,
        "pickTime" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "timeToMake" INTEGER,
        "isAutoPick" BOOLEAN DEFAULT false,
        UNIQUE("draftId", round, "pickInRound")
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "DraftPick_draftId_idx" ON "DraftPick"("draftId")');
    await client.query('CREATE INDEX IF NOT EXISTS "DraftPick_participantId_idx" ON "DraftPick"("participantId")');
    await client.query('CREATE INDEX IF NOT EXISTS "DraftPick_userId_idx" ON "DraftPick"("userId")');
    console.log('✅ Created DraftPick table');

    // 33. DraftBoard table (depends on Draft)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "DraftBoard" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "draftId" TEXT UNIQUE NOT NULL REFERENCES "Draft"(id) ON DELETE CASCADE,
        "availablePlayers" TEXT NOT NULL,
        rankings TEXT NOT NULL,
        adp TEXT NOT NULL,
        projections TEXT NOT NULL,
        "lastUpdated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "DraftBoard_draftId_idx" ON "DraftBoard"("draftId")');
    console.log('✅ Created DraftBoard table');

    // 34. MockDraft table (depends on User)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "MockDraft" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        sport TEXT DEFAULT 'FOOTBALL',
        "draftType" TEXT NOT NULL,
        "teamCount" INTEGER DEFAULT 12,
        rounds INTEGER DEFAULT 15,
        "userPosition" INTEGER NOT NULL,
        results TEXT NOT NULL,
        "userTeam" TEXT NOT NULL,
        "aiAnalysis" TEXT,
        score FLOAT,
        "completedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "MockDraft_userId_idx" ON "MockDraft"("userId")');
    await client.query('CREATE INDEX IF NOT EXISTS "MockDraft_sport_idx" ON "MockDraft"(sport)');
    console.log('✅ Created MockDraft table');

    // 35. Message table (depends on User, League, and Draft)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Message" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "senderId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "recipientId" TEXT REFERENCES "User"(id) ON DELETE CASCADE,
        "leagueId" TEXT REFERENCES "League"(id) ON DELETE CASCADE,
        "draftId" TEXT REFERENCES "Draft"(id) ON DELETE CASCADE,
        "messageType" TEXT DEFAULT 'TEXT',
        content TEXT NOT NULL,
        attachments TEXT,
        "isEdited" BOOLEAN DEFAULT false,
        "editedAt" TIMESTAMP,
        "isDeleted" BOOLEAN DEFAULT false,
        "deletedAt" TIMESTAMP,
        "parentId" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "Message_leagueId_idx" ON "Message"("leagueId")');
    await client.query('CREATE INDEX IF NOT EXISTS "Message_draftId_idx" ON "Message"("draftId")');
    await client.query('CREATE INDEX IF NOT EXISTS "Message_senderId_idx" ON "Message"("senderId")');
    await client.query('CREATE INDEX IF NOT EXISTS "Message_createdAt_idx" ON "Message"("createdAt")');
    console.log('✅ Created Message table');

    // Add self-referencing foreign key for Message replies
    await client.query(`
      ALTER TABLE "Message" 
      ADD CONSTRAINT "Message_parentId_fkey" 
      FOREIGN KEY ("parentId") REFERENCES "Message"(id)
    `);

    // 36. ActivityItem table (depends on User and League)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ActivityItem" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "leagueId" TEXT REFERENCES "League"(id) ON DELETE CASCADE,
        "activityType" TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        metadata TEXT,
        "isPublic" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "ActivityItem_userId_idx" ON "ActivityItem"("userId")');
    await client.query('CREATE INDEX IF NOT EXISTS "ActivityItem_leagueId_idx" ON "ActivityItem"("leagueId")');
    await client.query('CREATE INDEX IF NOT EXISTS "ActivityItem_activityType_idx" ON "ActivityItem"("activityType")');
    await client.query('CREATE INDEX IF NOT EXISTS "ActivityItem_createdAt_idx" ON "ActivityItem"("createdAt")');
    console.log('✅ Created ActivityItem table');

    // 37. Reaction table (depends on User, Message, and ActivityItem)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Reaction" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "messageId" TEXT REFERENCES "Message"(id) ON DELETE CASCADE,
        "activityId" TEXT REFERENCES "ActivityItem"(id) ON DELETE CASCADE,
        "reactionType" TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "messageId", "reactionType"),
        UNIQUE("userId", "activityId", "reactionType")
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "Reaction_messageId_idx" ON "Reaction"("messageId")');
    await client.query('CREATE INDEX IF NOT EXISTS "Reaction_activityId_idx" ON "Reaction"("activityId")');
    console.log('✅ Created Reaction table');

    // 38. Friendship table (depends on User)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Friendship" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "initiatorId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "recipientId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'PENDING',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("initiatorId", "recipientId")
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "Friendship_initiatorId_idx" ON "Friendship"("initiatorId")');
    await client.query('CREATE INDEX IF NOT EXISTS "Friendship_recipientId_idx" ON "Friendship"("recipientId")');
    await client.query('CREATE INDEX IF NOT EXISTS "Friendship_status_idx" ON "Friendship"(status)');
    console.log('✅ Created Friendship table');

    // 39. Notification table (depends on User)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Notification" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "notificationType" TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        "isRead" BOOLEAN DEFAULT false,
        "readAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId")');
    await client.query('CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead")');
    await client.query('CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt")');
    console.log('✅ Created Notification table');

    // 40. BettingOdds table (depends on Player)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "BettingOdds" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "playerId" TEXT NOT NULL REFERENCES "Player"(id) ON DELETE CASCADE,
        "gameId" TEXT NOT NULL,
        "propType" TEXT NOT NULL,
        "propName" TEXT NOT NULL,
        line FLOAT NOT NULL,
        "overOdds" INTEGER NOT NULL,
        "underOdds" INTEGER NOT NULL,
        sportsbook TEXT NOT NULL,
        volume INTEGER DEFAULT 0,
        "isLive" BOOLEAN DEFAULT true,
        confidence FLOAT DEFAULT 50,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "lastUpdated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "BettingOdds_playerId_idx" ON "BettingOdds"("playerId")');
    await client.query('CREATE INDEX IF NOT EXISTS "BettingOdds_gameId_idx" ON "BettingOdds"("gameId")');
    await client.query('CREATE INDEX IF NOT EXISTS "BettingOdds_propType_idx" ON "BettingOdds"("propType")');
    await client.query('CREATE INDEX IF NOT EXISTS "BettingOdds_isLive_idx" ON "BettingOdds"("isLive")');
    console.log('✅ Created BettingOdds table');

    // 41. BettingSlip table (depends on User)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "BettingSlip" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "totalOdds" FLOAT NOT NULL,
        "potentialPayout" FLOAT NOT NULL,
        stake FLOAT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        "placedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "settledAt" TIMESTAMP,
        "actualPayout" FLOAT
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "BettingSlip_userId_idx" ON "BettingSlip"("userId")');
    await client.query('CREATE INDEX IF NOT EXISTS "BettingSlip_status_idx" ON "BettingSlip"(status)');
    await client.query('CREATE INDEX IF NOT EXISTS "BettingSlip_placedAt_idx" ON "BettingSlip"("placedAt")');
    console.log('✅ Created BettingSlip table');

    // 42. BettingSelection table (depends on BettingSlip and BettingOdds)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "BettingSelection" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "bettingSlipId" TEXT NOT NULL REFERENCES "BettingSlip"(id) ON DELETE CASCADE,
        "oddsId" TEXT NOT NULL REFERENCES "BettingOdds"(id) ON DELETE CASCADE,
        selection TEXT NOT NULL,
        line FLOAT NOT NULL,
        "oddsValue" INTEGER NOT NULL,
        stake FLOAT NOT NULL,
        "potentialPayout" FLOAT NOT NULL,
        "isWon" BOOLEAN,
        "actualResult" FLOAT
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "BettingSelection_bettingSlipId_idx" ON "BettingSelection"("bettingSlipId")');
    await client.query('CREATE INDEX IF NOT EXISTS "BettingSelection_oddsId_idx" ON "BettingSelection"("oddsId")');
    console.log('✅ Created BettingSelection table');

    // 43. OddsMovement table (depends on BettingOdds)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "OddsMovement" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "oddsId" TEXT NOT NULL REFERENCES "BettingOdds"(id) ON DELETE CASCADE,
        "previousLine" FLOAT NOT NULL,
        "newLine" FLOAT NOT NULL,
        "previousOverOdds" INTEGER NOT NULL,
        "newOverOdds" INTEGER NOT NULL,
        "previousUnderOdds" INTEGER NOT NULL,
        "newUnderOdds" INTEGER NOT NULL,
        movement FLOAT NOT NULL,
        trigger TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "OddsMovement_oddsId_idx" ON "OddsMovement"("oddsId")');
    await client.query('CREATE INDEX IF NOT EXISTS "OddsMovement_timestamp_idx" ON "OddsMovement"(timestamp)');
    console.log('✅ Created OddsMovement table');

    // 44. PlayerPropHistory table (depends on Player)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "PlayerPropHistory" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "playerId" TEXT NOT NULL REFERENCES "Player"(id) ON DELETE CASCADE,
        "gameId" TEXT NOT NULL,
        "propType" TEXT NOT NULL,
        line FLOAT NOT NULL,
        "actualResult" FLOAT NOT NULL,
        hit BOOLEAN NOT NULL,
        "gameDate" TIMESTAMP NOT NULL,
        opponent TEXT NOT NULL
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "PlayerPropHistory_playerId_idx" ON "PlayerPropHistory"("playerId")');
    await client.query('CREATE INDEX IF NOT EXISTS "PlayerPropHistory_propType_idx" ON "PlayerPropHistory"("propType")');
    await client.query('CREATE INDEX IF NOT EXISTS "PlayerPropHistory_gameDate_idx" ON "PlayerPropHistory"("gameDate")');
    console.log('✅ Created PlayerPropHistory table');

    // 45. BettingInsight table (depends on Player)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "BettingInsight" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "playerId" TEXT NOT NULL REFERENCES "Player"(id) ON DELETE CASCADE,
        "propType" TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        confidence FLOAT NOT NULL,
        reasoning TEXT NOT NULL,
        "keyFactors" TEXT NOT NULL,
        "generatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TIMESTAMP NOT NULL
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "BettingInsight_playerId_idx" ON "BettingInsight"("playerId")');
    await client.query('CREATE INDEX IF NOT EXISTS "BettingInsight_propType_idx" ON "BettingInsight"("propType")');
    await client.query('CREATE INDEX IF NOT EXISTS "BettingInsight_confidence_idx" ON "BettingInsight"(confidence)');
    await client.query('CREATE INDEX IF NOT EXISTS "BettingInsight_expiresAt_idx" ON "BettingInsight"("expiresAt")');
    console.log('✅ Created BettingInsight table');

    // Data Collection Tables
    
    // 46. DataCollectionRun table (no dependencies)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "DataCollectionRun" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        source TEXT NOT NULL,
        "dataType" TEXT NOT NULL,
        "startTime" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "endTime" TIMESTAMP,
        "recordsCount" INTEGER DEFAULT 0,
        status TEXT DEFAULT 'RUNNING',
        error TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "DataCollectionRun_source_idx" ON "DataCollectionRun"(source)');
    await client.query('CREATE INDEX IF NOT EXISTS "DataCollectionRun_dataType_idx" ON "DataCollectionRun"("dataType")');
    await client.query('CREATE INDEX IF NOT EXISTS "DataCollectionRun_status_idx" ON "DataCollectionRun"(status)');
    await client.query('CREATE INDEX IF NOT EXISTS "DataCollectionRun_createdAt_idx" ON "DataCollectionRun"("createdAt")');
    console.log('✅ Created DataCollectionRun table');

    // 47. RawDataCache table (depends on DataCollectionRun)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "RawDataCache" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "collectionRunId" TEXT NOT NULL REFERENCES "DataCollectionRun"(id) ON DELETE CASCADE,
        source TEXT NOT NULL,
        "dataType" TEXT NOT NULL,
        url TEXT,
        "rawData" TEXT NOT NULL,
        "recordCount" INTEGER DEFAULT 0,
        "isProcessed" BOOLEAN DEFAULT false,
        "processedAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "RawDataCache_collectionRunId_idx" ON "RawDataCache"("collectionRunId")');
    await client.query('CREATE INDEX IF NOT EXISTS "RawDataCache_source_idx" ON "RawDataCache"(source)');
    await client.query('CREATE INDEX IF NOT EXISTS "RawDataCache_isProcessed_idx" ON "RawDataCache"("isProcessed")');
    await client.query('CREATE INDEX IF NOT EXISTS "RawDataCache_createdAt_idx" ON "RawDataCache"("createdAt")');
    console.log('✅ Created RawDataCache table');

    // 48. ProcessingLog table (depends on RawDataCache)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "ProcessingLog" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "rawDataId" TEXT NOT NULL REFERENCES "RawDataCache"(id) ON DELETE CASCADE,
        "processType" TEXT NOT NULL,
        "recordsProcessed" INTEGER DEFAULT 0,
        "recordsFailed" INTEGER DEFAULT 0,
        status TEXT DEFAULT 'PROCESSING',
        error TEXT,
        "startTime" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "endTime" TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "ProcessingLog_rawDataId_idx" ON "ProcessingLog"("rawDataId")');
    await client.query('CREATE INDEX IF NOT EXISTS "ProcessingLog_processType_idx" ON "ProcessingLog"("processType")');
    await client.query('CREATE INDEX IF NOT EXISTS "ProcessingLog_status_idx" ON "ProcessingLog"(status)');
    console.log('✅ Created ProcessingLog table');

    // 49. NewsArticle table (no dependencies)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "NewsArticle" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        source TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        summary TEXT,
        url TEXT UNIQUE NOT NULL,
        author TEXT,
        "publishedAt" TIMESTAMP NOT NULL,
        sport TEXT,
        teams TEXT,
        players TEXT,
        sentiment FLOAT,
        category TEXT,
        "imageUrl" TEXT,
        "isProcessed" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "NewsArticle_source_idx" ON "NewsArticle"(source)');
    await client.query('CREATE INDEX IF NOT EXISTS "NewsArticle_sport_idx" ON "NewsArticle"(sport)');
    await client.query('CREATE INDEX IF NOT EXISTS "NewsArticle_publishedAt_idx" ON "NewsArticle"("publishedAt")');
    await client.query('CREATE INDEX IF NOT EXISTS "NewsArticle_isProcessed_idx" ON "NewsArticle"("isProcessed")');
    console.log('✅ Created NewsArticle table');

    // 50. GameData table (no dependencies)
    await client.query(`
      CREATE TABLE IF NOT EXISTS "GameData" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "externalId" TEXT UNIQUE NOT NULL,
        sport TEXT NOT NULL,
        "homeTeam" TEXT NOT NULL,
        "awayTeam" TEXT NOT NULL,
        "gameTime" TIMESTAMP NOT NULL,
        venue TEXT,
        weather TEXT,
        "homeScore" INTEGER,
        "awayScore" INTEGER,
        status TEXT NOT NULL,
        quarter INTEGER,
        "timeLeft" TEXT,
        "lastPlay" TEXT,
        "scoringPlays" TEXT,
        statistics TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS "GameData_sport_idx" ON "GameData"(sport)');
    await client.query('CREATE INDEX IF NOT EXISTS "GameData_gameTime_idx" ON "GameData"("gameTime")');
    await client.query('CREATE INDEX IF NOT EXISTS "GameData_status_idx" ON "GameData"(status)');
    await client.query('CREATE INDEX IF NOT EXISTS "GameData_homeTeam_idx" ON "GameData"("homeTeam")');
    await client.query('CREATE INDEX IF NOT EXISTS "GameData_awayTeam_idx" ON "GameData"("awayTeam")');
    console.log('✅ Created GameData table');

    // Commit transaction
    await client.query('COMMIT');
    console.log('✅ All tables created successfully!');

    // Create triggers for updated_at columns
    console.log('📋 Creating update triggers...');
    
    // Create the update timestamp function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers for all tables with updatedAt column
    const tablesWithUpdatedAt = [
      'User', 'Subscription', 'League', 'WageringSettings', 'MemberWageringOptIn',
      'Team', 'Player', 'Roster', 'Prediction', 'UserPreferences', 'UserSubscription',
      'Wager', 'EscrowAccount', 'Bounty', 'UserWallet', 'Contest', 'DFSLineup',
      'Draft', 'Message', 'Friendship', 'BettingOdds', 'NewsArticle', 'GameData'
    ];

    for (const table of tablesWithUpdatedAt) {
      await client.query(`
        CREATE TRIGGER update_${table}_updated_at BEFORE UPDATE ON "${table}"
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
      `);
    }
    console.log('✅ Update triggers created!');

    console.log('🎉 Database setup complete!');
    console.log('📊 Total tables created: 50');
    console.log('🔗 Ready for 5,040 players!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error setting up database:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the setup
setupDatabase()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });