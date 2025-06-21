--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ActivityType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ActivityType" AS ENUM (
    'TRADE_COMPLETED',
    'WAIVER_CLAIM',
    'LINEUP_SET',
    'PLAYER_DROPPED',
    'PLAYER_ADDED',
    'DRAFT_PICK_MADE',
    'CONTEST_WON',
    'WAGER_WON',
    'ACHIEVEMENT_UNLOCKED',
    'MILESTONE_REACHED'
);


--
-- Name: AlertType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AlertType" AS ENUM (
    'PLAYER_UPDATE',
    'TRADE_SUGGESTION',
    'LINEUP_RECOMMENDATION',
    'INJURY_ALERT',
    'SCORING_UPDATE',
    'WAGER_UPDATE',
    'BOUNTY_ALERT',
    'ESCROW_UPDATE'
);


--
-- Name: BetSelection; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BetSelection" AS ENUM (
    'OVER',
    'UNDER'
);


--
-- Name: BettingSlipStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BettingSlipStatus" AS ENUM (
    'PENDING',
    'WON',
    'LOST',
    'CANCELLED',
    'PARTIALLY_WON'
);


--
-- Name: BillingInterval; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BillingInterval" AS ENUM (
    'monthly',
    'yearly'
);


--
-- Name: BountyStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BountyStatus" AS ENUM (
    'OPEN',
    'ACTIVE',
    'COMPLETED',
    'EXPIRED',
    'CANCELLED'
);


--
-- Name: ContestStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ContestStatus" AS ENUM (
    'UPCOMING',
    'LIVE',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: ContestType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ContestType" AS ENUM (
    'TOURNAMENT',
    'CASH_GAME',
    'HEAD_TO_HEAD',
    'FIFTY_FIFTY',
    'DOUBLE_UP',
    'MULTIPLIER',
    'SATELLITE'
);


--
-- Name: DraftOrder; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DraftOrder" AS ENUM (
    'STANDARD',
    'SNAKE',
    'LINEAR',
    'THIRD_ROUND_REVERSAL'
);


--
-- Name: DraftStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DraftStatus" AS ENUM (
    'SCHEDULED',
    'WAITING_FOR_PLAYERS',
    'IN_PROGRESS',
    'PAUSED',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: DraftType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DraftType" AS ENUM (
    'STANDARD',
    'PPR',
    'HALF_PPR',
    'SUPERFLEX',
    'DYNASTY',
    'KEEPER',
    'IDP',
    'BEST_BALL'
);


--
-- Name: EscrowStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EscrowStatus" AS ENUM (
    'ACTIVE',
    'RELEASED',
    'REFUNDED',
    'DISPUTED'
);


--
-- Name: FantasyProvider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."FantasyProvider" AS ENUM (
    'YAHOO',
    'ESPN',
    'CBS',
    'SLEEPER'
);


--
-- Name: FriendshipStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."FriendshipStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'BLOCKED',
    'DECLINED'
);


--
-- Name: InsightRecommendation; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InsightRecommendation" AS ENUM (
    'OVER',
    'UNDER',
    'AVOID',
    'STRONG_OVER',
    'STRONG_UNDER'
);


--
-- Name: MessageType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MessageType" AS ENUM (
    'TEXT',
    'IMAGE',
    'FILE',
    'TRADE_PROPOSAL',
    'WAGER_CHALLENGE',
    'DRAFT_PICK',
    'SYSTEM_MESSAGE'
);


--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."NotificationType" AS ENUM (
    'FRIEND_REQUEST',
    'MESSAGE_RECEIVED',
    'TRADE_PROPOSAL',
    'WAGER_CHALLENGE',
    'DRAFT_STARTING',
    'LINEUP_REMINDER',
    'PLAYER_NEWS',
    'ACHIEVEMENT',
    'SYSTEM_UPDATE'
);


--
-- Name: PredictionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PredictionType" AS ENUM (
    'POINTS',
    'PERFORMANCE',
    'INJURY_RISK',
    'TRADE_VALUE'
);


--
-- Name: PropType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PropType" AS ENUM (
    'PASSING_YARDS',
    'PASSING_TOUCHDOWNS',
    'PASSING_ATTEMPTS',
    'PASSING_COMPLETIONS',
    'RUSHING_YARDS',
    'RUSHING_TOUCHDOWNS',
    'RUSHING_ATTEMPTS',
    'RECEIVING_YARDS',
    'RECEIVING_TOUCHDOWNS',
    'RECEPTIONS',
    'RECEIVING_TARGETS',
    'FIELD_GOALS_MADE',
    'EXTRA_POINTS_MADE',
    'KICKING_POINTS',
    'INTERCEPTIONS_THROWN',
    'FUMBLES_LOST',
    'SACKS_TAKEN',
    'FANTASY_POINTS'
);


--
-- Name: ReactionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReactionType" AS ENUM (
    'LIKE',
    'LOVE',
    'LAUGH',
    'ANGRY',
    'SURPRISED',
    'FIRE',
    'TROPHY'
);


--
-- Name: Sport; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Sport" AS ENUM (
    'FOOTBALL',
    'BASKETBALL',
    'BASEBALL',
    'HOCKEY'
);


--
-- Name: SubscriptionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SubscriptionStatus" AS ENUM (
    'ACTIVE',
    'CANCELLED',
    'EXPIRED',
    'TRIAL'
);


--
-- Name: SubscriptionTier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SubscriptionTier" AS ENUM (
    'FREE',
    'PRO',
    'ELITE'
);


--
-- Name: TransactionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TransactionStatus" AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
);


--
-- Name: TransactionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TransactionType" AS ENUM (
    'DEPOSIT',
    'WITHDRAWAL',
    'ESCROW_LOCK',
    'ESCROW_RELEASE',
    'WAGER_WIN',
    'WAGER_LOSS',
    'BOUNTY_WIN',
    'BOUNTY_LOSS',
    'REFUND'
);


--
-- Name: UpdateType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UpdateType" AS ENUM (
    'SCORE_UPDATE',
    'STATUS_CHANGE',
    'PAYMENT_UPDATE',
    'PLAYER_UPDATE',
    'SYSTEM_MESSAGE'
);


--
-- Name: WagerSide; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."WagerSide" AS ENUM (
    'CREATOR',
    'OPPONENT'
);


--
-- Name: WagerStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."WagerStatus" AS ENUM (
    'OPEN',
    'MATCHED',
    'ACTIVE',
    'PENDING_SETTLEMENT',
    'SETTLED',
    'CANCELLED',
    'DISPUTED'
);


--
-- Name: WagerTimeframe; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."WagerTimeframe" AS ENUM (
    'SINGLE_GAME',
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'SEASON',
    'CUSTOM'
);


--
-- Name: WagerType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."WagerType" AS ENUM (
    'PERFORMANCE_BET',
    'HEAD_TO_HEAD',
    'PROP_BET',
    'PLAYER_TRADE',
    'CUSTOM'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ActivityItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ActivityItem" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "leagueId" text,
    "activityType" public."ActivityType" NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    metadata jsonb,
    "isPublic" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Alert; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Alert" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."AlertType" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb,
    read boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: BettingInsight; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BettingInsight" (
    id text NOT NULL,
    "playerId" text NOT NULL,
    "propType" public."PropType" NOT NULL,
    recommendation public."InsightRecommendation" NOT NULL,
    confidence double precision NOT NULL,
    reasoning text NOT NULL,
    "keyFactors" jsonb NOT NULL,
    "generatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: BettingOdds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BettingOdds" (
    id text NOT NULL,
    "playerId" text NOT NULL,
    "gameId" text NOT NULL,
    "propType" public."PropType" NOT NULL,
    "propName" text NOT NULL,
    line double precision NOT NULL,
    "overOdds" integer NOT NULL,
    "underOdds" integer NOT NULL,
    sportsbook text NOT NULL,
    volume integer DEFAULT 0 NOT NULL,
    "isLive" boolean DEFAULT true NOT NULL,
    confidence double precision DEFAULT 50 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastUpdated" timestamp(3) without time zone NOT NULL
);


--
-- Name: BettingSelection; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BettingSelection" (
    id text NOT NULL,
    "bettingSlipId" text NOT NULL,
    "oddsId" text NOT NULL,
    selection public."BetSelection" NOT NULL,
    line double precision NOT NULL,
    "oddsValue" integer NOT NULL,
    stake double precision NOT NULL,
    "potentialPayout" double precision NOT NULL,
    "isWon" boolean,
    "actualResult" double precision
);


--
-- Name: BettingSlip; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BettingSlip" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "totalOdds" double precision NOT NULL,
    "potentialPayout" double precision NOT NULL,
    stake double precision NOT NULL,
    status public."BettingSlipStatus" DEFAULT 'PENDING'::public."BettingSlipStatus" NOT NULL,
    "placedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "settledAt" timestamp(3) without time zone,
    "actualPayout" double precision
);


--
-- Name: Bounty; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Bounty" (
    id text NOT NULL,
    "creatorId" text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "bountyAmount" double precision NOT NULL,
    "targetMetric" jsonb NOT NULL,
    timeframe public."WagerTimeframe" NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    status public."BountyStatus" DEFAULT 'OPEN'::public."BountyStatus" NOT NULL,
    "maxParticipants" integer DEFAULT 1 NOT NULL,
    "isPublic" boolean DEFAULT true NOT NULL,
    "escrowId" text NOT NULL,
    "winnerId" text,
    "settledAt" timestamp(3) without time zone,
    "leagueId" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: BountyParticipant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BountyParticipant" (
    id text NOT NULL,
    "bountyId" text NOT NULL,
    "participantId" text NOT NULL,
    "stakeAmount" double precision NOT NULL,
    "currentScore" double precision DEFAULT 0 NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: BountyUpdate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BountyUpdate" (
    id text NOT NULL,
    "bountyId" text NOT NULL,
    type public."UpdateType" NOT NULL,
    message text NOT NULL,
    data jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Contest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Contest" (
    id text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    sport public."Sport" DEFAULT 'FOOTBALL'::public."Sport" NOT NULL,
    "contestType" public."ContestType" NOT NULL,
    "entryFee" double precision NOT NULL,
    "totalPrizePool" double precision NOT NULL,
    "maxEntries" integer NOT NULL,
    "currentEntries" integer DEFAULT 0 NOT NULL,
    "salaryCap" double precision DEFAULT 50000 NOT NULL,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL,
    status public."ContestStatus" DEFAULT 'UPCOMING'::public."ContestStatus" NOT NULL,
    "isPublic" boolean DEFAULT true NOT NULL,
    "isGuaranteed" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ContestEntry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ContestEntry" (
    id text NOT NULL,
    "contestId" text NOT NULL,
    "userId" text NOT NULL,
    "lineupId" text NOT NULL,
    "entryNumber" integer NOT NULL,
    "totalPoints" double precision DEFAULT 0 NOT NULL,
    rank integer,
    payout double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ContestResult; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ContestResult" (
    id text NOT NULL,
    "contestId" text NOT NULL,
    "userId" text NOT NULL,
    "entryId" text NOT NULL,
    "finalRank" integer NOT NULL,
    "finalPoints" double precision NOT NULL,
    payout double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: DFSLineup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DFSLineup" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "contestId" text NOT NULL,
    name text NOT NULL,
    "totalSalary" double precision NOT NULL,
    "totalPoints" double precision DEFAULT 0 NOT NULL,
    "isOptimal" boolean DEFAULT false NOT NULL,
    "isLocked" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: DFSLineupPlayer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DFSLineupPlayer" (
    id text NOT NULL,
    "lineupId" text NOT NULL,
    "dfsPlayerId" text NOT NULL,
    "position" text NOT NULL,
    "slotPosition" text NOT NULL,
    salary double precision NOT NULL,
    points double precision DEFAULT 0 NOT NULL
);


--
-- Name: DFSPlayer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DFSPlayer" (
    id text NOT NULL,
    "contestId" text NOT NULL,
    "externalPlayerId" text NOT NULL,
    name text NOT NULL,
    team text NOT NULL,
    "position" text NOT NULL,
    salary double precision NOT NULL,
    "projectedPoints" double precision NOT NULL,
    "actualPoints" double precision DEFAULT 0 NOT NULL,
    ownership double precision DEFAULT 0 NOT NULL,
    value double precision DEFAULT 0 NOT NULL,
    "gameTime" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "injuryStatus" text
);


--
-- Name: Draft; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Draft" (
    id text NOT NULL,
    "creatorId" text NOT NULL,
    "leagueId" text,
    name text NOT NULL,
    description text,
    sport public."Sport" DEFAULT 'FOOTBALL'::public."Sport" NOT NULL,
    "draftType" public."DraftType" NOT NULL,
    "draftOrder" public."DraftOrder" DEFAULT 'STANDARD'::public."DraftOrder" NOT NULL,
    "totalRounds" integer DEFAULT 15 NOT NULL,
    "timePerPick" integer DEFAULT 90 NOT NULL,
    "isAuction" boolean DEFAULT false NOT NULL,
    "auctionBudget" double precision,
    "isSnakeDraft" boolean DEFAULT true NOT NULL,
    "isMockDraft" boolean DEFAULT false NOT NULL,
    "isPublic" boolean DEFAULT true NOT NULL,
    "maxParticipants" integer DEFAULT 12 NOT NULL,
    "scheduledStart" timestamp(3) without time zone,
    "actualStart" timestamp(3) without time zone,
    "endedAt" timestamp(3) without time zone,
    status public."DraftStatus" DEFAULT 'SCHEDULED'::public."DraftStatus" NOT NULL,
    "currentRound" integer DEFAULT 1 NOT NULL,
    "currentPick" integer DEFAULT 1 NOT NULL,
    "currentPickerId" text,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: DraftBoard; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DraftBoard" (
    id text NOT NULL,
    "draftId" text NOT NULL,
    "availablePlayers" jsonb NOT NULL,
    rankings jsonb NOT NULL,
    adp jsonb NOT NULL,
    projections jsonb NOT NULL,
    "lastUpdated" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: DraftParticipant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DraftParticipant" (
    id text NOT NULL,
    "draftId" text NOT NULL,
    "userId" text NOT NULL,
    "draftPosition" integer NOT NULL,
    "teamName" text,
    "isReady" boolean DEFAULT false NOT NULL,
    "isAutoPick" boolean DEFAULT false NOT NULL,
    timeouts integer DEFAULT 3 NOT NULL,
    "totalSpent" double precision DEFAULT 0 NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: DraftPick; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DraftPick" (
    id text NOT NULL,
    "draftId" text NOT NULL,
    "participantId" text NOT NULL,
    "userId" text NOT NULL,
    "playerId" text NOT NULL,
    "playerName" text NOT NULL,
    "playerPosition" text NOT NULL,
    "playerTeam" text NOT NULL,
    round integer NOT NULL,
    pick integer NOT NULL,
    "pickInRound" integer NOT NULL,
    "auctionPrice" double precision,
    "isKeeper" boolean DEFAULT false NOT NULL,
    "pickTime" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "timeToMake" integer,
    "isAutoPick" boolean DEFAULT false NOT NULL
);


--
-- Name: EscrowAccount; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EscrowAccount" (
    id text NOT NULL,
    "totalAmount" double precision NOT NULL,
    "creatorAmount" double precision NOT NULL,
    "opponentAmount" double precision NOT NULL,
    status public."EscrowStatus" DEFAULT 'ACTIVE'::public."EscrowStatus" NOT NULL,
    "stripePaymentIntentId" text,
    "releasedAt" timestamp(3) without time zone,
    "releasedToId" text,
    "refundedAt" timestamp(3) without time zone,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: EscrowTransaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EscrowTransaction" (
    id text NOT NULL,
    "escrowId" text NOT NULL,
    "userId" text NOT NULL,
    type public."TransactionType" NOT NULL,
    amount double precision NOT NULL,
    status public."TransactionStatus" DEFAULT 'PENDING'::public."TransactionStatus" NOT NULL,
    "stripeTransactionId" text,
    description text NOT NULL,
    "processedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Friendship; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Friendship" (
    id text NOT NULL,
    "initiatorId" text NOT NULL,
    "recipientId" text NOT NULL,
    status public."FriendshipStatus" DEFAULT 'PENDING'::public."FriendshipStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: League; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."League" (
    id text NOT NULL,
    "userId" text NOT NULL,
    provider public."FantasyProvider" NOT NULL,
    "providerId" text NOT NULL,
    name text NOT NULL,
    season text NOT NULL,
    sport public."Sport" DEFAULT 'FOOTBALL'::public."Sport" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    settings jsonb NOT NULL,
    "lastSync" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "wageringEnabled" boolean DEFAULT false NOT NULL
);


--
-- Name: MemberWageringOptIn; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MemberWageringOptIn" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "wageringSettingsId" text NOT NULL,
    "optedIn" boolean DEFAULT false NOT NULL,
    "dailyLimit" double precision,
    "weeklyLimit" double precision,
    "allowLiveBetting" boolean DEFAULT true NOT NULL,
    "allowPlayerTrades" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "senderId" text NOT NULL,
    "recipientId" text,
    "leagueId" text,
    "draftId" text,
    "messageType" public."MessageType" DEFAULT 'TEXT'::public."MessageType" NOT NULL,
    content text NOT NULL,
    attachments jsonb,
    "isEdited" boolean DEFAULT false NOT NULL,
    "editedAt" timestamp(3) without time zone,
    "isDeleted" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "parentId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: MockDraft; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MockDraft" (
    id text NOT NULL,
    "userId" text NOT NULL,
    sport public."Sport" DEFAULT 'FOOTBALL'::public."Sport" NOT NULL,
    "draftType" public."DraftType" NOT NULL,
    "teamCount" integer DEFAULT 12 NOT NULL,
    rounds integer DEFAULT 15 NOT NULL,
    "userPosition" integer NOT NULL,
    results jsonb NOT NULL,
    "userTeam" jsonb NOT NULL,
    "aiAnalysis" jsonb,
    score double precision,
    "completedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "notificationType" public."NotificationType" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb,
    "isRead" boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: OddsMovement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OddsMovement" (
    id text NOT NULL,
    "oddsId" text NOT NULL,
    "previousLine" double precision NOT NULL,
    "newLine" double precision NOT NULL,
    "previousOverOdds" integer NOT NULL,
    "newOverOdds" integer NOT NULL,
    "previousUnderOdds" integer NOT NULL,
    "newUnderOdds" integer NOT NULL,
    movement double precision NOT NULL,
    trigger text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Player; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Player" (
    id text NOT NULL,
    "externalId" text NOT NULL,
    name text NOT NULL,
    "position" text NOT NULL,
    team text NOT NULL,
    "leagueId" text NOT NULL,
    stats jsonb NOT NULL,
    projections jsonb,
    "injuryStatus" text,
    "imageUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PlayerPropHistory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PlayerPropHistory" (
    id text NOT NULL,
    "playerId" text NOT NULL,
    "gameId" text NOT NULL,
    "propType" public."PropType" NOT NULL,
    line double precision NOT NULL,
    "actualResult" double precision NOT NULL,
    hit boolean NOT NULL,
    "gameDate" timestamp(3) without time zone NOT NULL,
    opponent text NOT NULL
);


--
-- Name: Prediction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Prediction" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "playerId" text NOT NULL,
    type public."PredictionType" NOT NULL,
    week integer NOT NULL,
    season text NOT NULL,
    prediction jsonb NOT NULL,
    confidence double precision NOT NULL,
    actual jsonb,
    accuracy double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Reaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Reaction" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "messageId" text,
    "activityId" text,
    "reactionType" public."ReactionType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Roster; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Roster" (
    id text NOT NULL,
    "teamId" text NOT NULL,
    "playerId" text NOT NULL,
    "position" text NOT NULL,
    "isStarter" boolean DEFAULT true NOT NULL,
    week integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Subscription; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Subscription" (
    id text NOT NULL,
    "userId" text NOT NULL,
    tier public."SubscriptionTier" DEFAULT 'FREE'::public."SubscriptionTier" NOT NULL,
    status public."SubscriptionStatus" DEFAULT 'ACTIVE'::public."SubscriptionStatus" NOT NULL,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endDate" timestamp(3) without time zone,
    "stripeCustomerId" text,
    "stripeSubscriptionId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Team" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "leagueId" text NOT NULL,
    name text NOT NULL,
    rank integer DEFAULT 0 NOT NULL,
    points double precision DEFAULT 0 NOT NULL,
    wins integer DEFAULT 0 NOT NULL,
    losses integer DEFAULT 0 NOT NULL,
    ties integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    image text,
    password text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: UserPreferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserPreferences" (
    id text NOT NULL,
    "userId" text NOT NULL,
    notifications jsonb DEFAULT '{}'::jsonb NOT NULL,
    theme text DEFAULT 'dark'::text NOT NULL,
    "aiPersonality" text DEFAULT 'professional'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: UserSubscription; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserSubscription" (
    id text NOT NULL,
    "userId" text NOT NULL,
    tier public."SubscriptionTier" NOT NULL,
    status public."SubscriptionStatus" NOT NULL,
    "billingInterval" public."BillingInterval" NOT NULL,
    "currentPeriodStart" timestamp(3) without time zone NOT NULL,
    "currentPeriodEnd" timestamp(3) without time zone NOT NULL,
    "cancelAtPeriodEnd" boolean DEFAULT false NOT NULL,
    "stripeSubscriptionId" text,
    "stripeCustomerId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: UserWallet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserWallet" (
    id text NOT NULL,
    "userId" text NOT NULL,
    balance double precision DEFAULT 0 NOT NULL,
    "lockedAmount" double precision DEFAULT 0 NOT NULL,
    "stripeCustomerId" text,
    "defaultPaymentMethodId" text,
    "totalDeposited" double precision DEFAULT 0 NOT NULL,
    "totalWithdrawn" double precision DEFAULT 0 NOT NULL,
    "totalWon" double precision DEFAULT 0 NOT NULL,
    "totalLost" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ValueSnapshot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ValueSnapshot" (
    id text NOT NULL,
    "playerId" text NOT NULL,
    "stockPrice" double precision NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "wagerId" text,
    metadata jsonb
);


--
-- Name: Wager; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Wager" (
    id text NOT NULL,
    "creatorId" text NOT NULL,
    "opponentId" text,
    type public."WagerType" NOT NULL,
    status public."WagerStatus" DEFAULT 'OPEN'::public."WagerStatus" NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    "totalValue" double precision NOT NULL,
    "creatorStake" double precision NOT NULL,
    "opponentStake" double precision NOT NULL,
    performance jsonb NOT NULL,
    timeframe public."WagerTimeframe" NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "settledAt" timestamp(3) without time zone,
    "winnerId" text,
    "escrowId" text NOT NULL,
    "leagueId" text,
    "isPublic" boolean DEFAULT true NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: WagerPlayer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WagerPlayer" (
    id text NOT NULL,
    "wagerId" text NOT NULL,
    "playerId" text NOT NULL,
    side public."WagerSide" NOT NULL,
    "stockPrice" double precision NOT NULL,
    "currentValue" double precision NOT NULL,
    "isTraded" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: WagerUpdate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WagerUpdate" (
    id text NOT NULL,
    "wagerId" text NOT NULL,
    type public."UpdateType" NOT NULL,
    message text NOT NULL,
    data jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: WageringSettings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WageringSettings" (
    id text NOT NULL,
    "leagueId" text NOT NULL,
    "enablePlayerTrading" boolean DEFAULT true NOT NULL,
    "enableLiveBetting" boolean DEFAULT false NOT NULL,
    "enableBounties" boolean DEFAULT true NOT NULL,
    "enablePropBets" boolean DEFAULT false NOT NULL,
    "enableCrypto" boolean DEFAULT false NOT NULL,
    "minWagerAmount" double precision DEFAULT 5.0 NOT NULL,
    "maxWagerAmount" double precision DEFAULT 1000.0 NOT NULL,
    "maxDailyWagerTotal" double precision DEFAULT 5000.0 NOT NULL,
    "requireCommissionerApproval" boolean DEFAULT false NOT NULL,
    "allowGuestBetting" boolean DEFAULT false NOT NULL,
    "blockedMembers" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "wageringAdmins" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "allowCrossLeagueBetting" boolean DEFAULT false NOT NULL,
    "profitSharingPercent" double precision DEFAULT 0.0 NOT NULL,
    "escrowHoldDays" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: subscription_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_usage (
    "userId" text NOT NULL,
    period text NOT NULL,
    "aiInsightsUsed" integer DEFAULT 0 NOT NULL,
    "voiceMinutesUsed" integer DEFAULT 0 NOT NULL,
    "leaguesCreated" integer DEFAULT 0 NOT NULL,
    "apiCallsMade" integer DEFAULT 0 NOT NULL,
    "lastUpdated" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ActivityItem ActivityItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ActivityItem"
    ADD CONSTRAINT "ActivityItem_pkey" PRIMARY KEY (id);


--
-- Name: Alert Alert_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Alert"
    ADD CONSTRAINT "Alert_pkey" PRIMARY KEY (id);


--
-- Name: BettingInsight BettingInsight_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BettingInsight"
    ADD CONSTRAINT "BettingInsight_pkey" PRIMARY KEY (id);


--
-- Name: BettingOdds BettingOdds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BettingOdds"
    ADD CONSTRAINT "BettingOdds_pkey" PRIMARY KEY (id);


--
-- Name: BettingSelection BettingSelection_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BettingSelection"
    ADD CONSTRAINT "BettingSelection_pkey" PRIMARY KEY (id);


--
-- Name: BettingSlip BettingSlip_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BettingSlip"
    ADD CONSTRAINT "BettingSlip_pkey" PRIMARY KEY (id);


--
-- Name: BountyParticipant BountyParticipant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BountyParticipant"
    ADD CONSTRAINT "BountyParticipant_pkey" PRIMARY KEY (id);


--
-- Name: BountyUpdate BountyUpdate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BountyUpdate"
    ADD CONSTRAINT "BountyUpdate_pkey" PRIMARY KEY (id);


--
-- Name: Bounty Bounty_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Bounty"
    ADD CONSTRAINT "Bounty_pkey" PRIMARY KEY (id);


--
-- Name: ContestEntry ContestEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContestEntry"
    ADD CONSTRAINT "ContestEntry_pkey" PRIMARY KEY (id);


--
-- Name: ContestResult ContestResult_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContestResult"
    ADD CONSTRAINT "ContestResult_pkey" PRIMARY KEY (id);


--
-- Name: Contest Contest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contest"
    ADD CONSTRAINT "Contest_pkey" PRIMARY KEY (id);


--
-- Name: DFSLineupPlayer DFSLineupPlayer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DFSLineupPlayer"
    ADD CONSTRAINT "DFSLineupPlayer_pkey" PRIMARY KEY (id);


--
-- Name: DFSLineup DFSLineup_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DFSLineup"
    ADD CONSTRAINT "DFSLineup_pkey" PRIMARY KEY (id);


--
-- Name: DFSPlayer DFSPlayer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DFSPlayer"
    ADD CONSTRAINT "DFSPlayer_pkey" PRIMARY KEY (id);


--
-- Name: DraftBoard DraftBoard_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DraftBoard"
    ADD CONSTRAINT "DraftBoard_pkey" PRIMARY KEY (id);


--
-- Name: DraftParticipant DraftParticipant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DraftParticipant"
    ADD CONSTRAINT "DraftParticipant_pkey" PRIMARY KEY (id);


--
-- Name: DraftPick DraftPick_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DraftPick"
    ADD CONSTRAINT "DraftPick_pkey" PRIMARY KEY (id);


--
-- Name: Draft Draft_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Draft"
    ADD CONSTRAINT "Draft_pkey" PRIMARY KEY (id);


--
-- Name: EscrowAccount EscrowAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EscrowAccount"
    ADD CONSTRAINT "EscrowAccount_pkey" PRIMARY KEY (id);


--
-- Name: EscrowTransaction EscrowTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EscrowTransaction"
    ADD CONSTRAINT "EscrowTransaction_pkey" PRIMARY KEY (id);


--
-- Name: Friendship Friendship_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Friendship"
    ADD CONSTRAINT "Friendship_pkey" PRIMARY KEY (id);


--
-- Name: League League_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."League"
    ADD CONSTRAINT "League_pkey" PRIMARY KEY (id);


--
-- Name: MemberWageringOptIn MemberWageringOptIn_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MemberWageringOptIn"
    ADD CONSTRAINT "MemberWageringOptIn_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: MockDraft MockDraft_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MockDraft"
    ADD CONSTRAINT "MockDraft_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: OddsMovement OddsMovement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OddsMovement"
    ADD CONSTRAINT "OddsMovement_pkey" PRIMARY KEY (id);


--
-- Name: PlayerPropHistory PlayerPropHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PlayerPropHistory"
    ADD CONSTRAINT "PlayerPropHistory_pkey" PRIMARY KEY (id);


--
-- Name: Player Player_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Player"
    ADD CONSTRAINT "Player_pkey" PRIMARY KEY (id);


--
-- Name: Prediction Prediction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Prediction"
    ADD CONSTRAINT "Prediction_pkey" PRIMARY KEY (id);


--
-- Name: Reaction Reaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reaction"
    ADD CONSTRAINT "Reaction_pkey" PRIMARY KEY (id);


--
-- Name: Roster Roster_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Roster"
    ADD CONSTRAINT "Roster_pkey" PRIMARY KEY (id);


--
-- Name: Subscription Subscription_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_pkey" PRIMARY KEY (id);


--
-- Name: Team Team_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Team"
    ADD CONSTRAINT "Team_pkey" PRIMARY KEY (id);


--
-- Name: UserPreferences UserPreferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserPreferences"
    ADD CONSTRAINT "UserPreferences_pkey" PRIMARY KEY (id);


--
-- Name: UserSubscription UserSubscription_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserSubscription"
    ADD CONSTRAINT "UserSubscription_pkey" PRIMARY KEY (id);


--
-- Name: UserWallet UserWallet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserWallet"
    ADD CONSTRAINT "UserWallet_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: ValueSnapshot ValueSnapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ValueSnapshot"
    ADD CONSTRAINT "ValueSnapshot_pkey" PRIMARY KEY (id);


--
-- Name: WagerPlayer WagerPlayer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WagerPlayer"
    ADD CONSTRAINT "WagerPlayer_pkey" PRIMARY KEY (id);


--
-- Name: WagerUpdate WagerUpdate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WagerUpdate"
    ADD CONSTRAINT "WagerUpdate_pkey" PRIMARY KEY (id);


--
-- Name: Wager Wager_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wager"
    ADD CONSTRAINT "Wager_pkey" PRIMARY KEY (id);


--
-- Name: WageringSettings WageringSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WageringSettings"
    ADD CONSTRAINT "WageringSettings_pkey" PRIMARY KEY (id);


--
-- Name: subscription_usage subscription_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_usage
    ADD CONSTRAINT subscription_usage_pkey PRIMARY KEY ("userId", period);


--
-- Name: ActivityItem_activityType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ActivityItem_activityType_idx" ON public."ActivityItem" USING btree ("activityType");


--
-- Name: ActivityItem_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ActivityItem_createdAt_idx" ON public."ActivityItem" USING btree ("createdAt");


--
-- Name: ActivityItem_leagueId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ActivityItem_leagueId_idx" ON public."ActivityItem" USING btree ("leagueId");


--
-- Name: ActivityItem_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ActivityItem_userId_idx" ON public."ActivityItem" USING btree ("userId");


--
-- Name: BettingInsight_confidence_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BettingInsight_confidence_idx" ON public."BettingInsight" USING btree (confidence);


--
-- Name: BettingInsight_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BettingInsight_expiresAt_idx" ON public."BettingInsight" USING btree ("expiresAt");


--
-- Name: BettingInsight_playerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BettingInsight_playerId_idx" ON public."BettingInsight" USING btree ("playerId");


--
-- Name: BettingInsight_propType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BettingInsight_propType_idx" ON public."BettingInsight" USING btree ("propType");


--
-- Name: BettingOdds_gameId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BettingOdds_gameId_idx" ON public."BettingOdds" USING btree ("gameId");


--
-- Name: BettingOdds_isLive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BettingOdds_isLive_idx" ON public."BettingOdds" USING btree ("isLive");


--
-- Name: BettingOdds_playerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BettingOdds_playerId_idx" ON public."BettingOdds" USING btree ("playerId");


--
-- Name: BettingOdds_propType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BettingOdds_propType_idx" ON public."BettingOdds" USING btree ("propType");


--
-- Name: BettingSelection_bettingSlipId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BettingSelection_bettingSlipId_idx" ON public."BettingSelection" USING btree ("bettingSlipId");


--
-- Name: BettingSelection_oddsId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BettingSelection_oddsId_idx" ON public."BettingSelection" USING btree ("oddsId");


--
-- Name: BettingSlip_placedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BettingSlip_placedAt_idx" ON public."BettingSlip" USING btree ("placedAt");


--
-- Name: BettingSlip_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BettingSlip_status_idx" ON public."BettingSlip" USING btree (status);


--
-- Name: BettingSlip_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BettingSlip_userId_idx" ON public."BettingSlip" USING btree ("userId");


--
-- Name: BountyParticipant_bountyId_participantId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "BountyParticipant_bountyId_participantId_key" ON public."BountyParticipant" USING btree ("bountyId", "participantId");


--
-- Name: BountyParticipant_participantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BountyParticipant_participantId_idx" ON public."BountyParticipant" USING btree ("participantId");


--
-- Name: BountyUpdate_bountyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BountyUpdate_bountyId_idx" ON public."BountyUpdate" USING btree ("bountyId");


--
-- Name: BountyUpdate_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BountyUpdate_type_idx" ON public."BountyUpdate" USING btree (type);


--
-- Name: Bounty_bountyAmount_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Bounty_bountyAmount_idx" ON public."Bounty" USING btree ("bountyAmount");


--
-- Name: Bounty_creatorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Bounty_creatorId_idx" ON public."Bounty" USING btree ("creatorId");


--
-- Name: Bounty_escrowId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Bounty_escrowId_key" ON public."Bounty" USING btree ("escrowId");


--
-- Name: Bounty_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Bounty_status_idx" ON public."Bounty" USING btree (status);


--
-- Name: ContestEntry_contestId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContestEntry_contestId_idx" ON public."ContestEntry" USING btree ("contestId");


--
-- Name: ContestEntry_contestId_userId_entryNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ContestEntry_contestId_userId_entryNumber_key" ON public."ContestEntry" USING btree ("contestId", "userId", "entryNumber");


--
-- Name: ContestEntry_lineupId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ContestEntry_lineupId_key" ON public."ContestEntry" USING btree ("lineupId");


--
-- Name: ContestEntry_totalPoints_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContestEntry_totalPoints_idx" ON public."ContestEntry" USING btree ("totalPoints");


--
-- Name: ContestEntry_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContestEntry_userId_idx" ON public."ContestEntry" USING btree ("userId");


--
-- Name: ContestResult_contestId_entryId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ContestResult_contestId_entryId_key" ON public."ContestResult" USING btree ("contestId", "entryId");


--
-- Name: ContestResult_contestId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContestResult_contestId_idx" ON public."ContestResult" USING btree ("contestId");


--
-- Name: ContestResult_finalRank_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContestResult_finalRank_idx" ON public."ContestResult" USING btree ("finalRank");


--
-- Name: ContestResult_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContestResult_userId_idx" ON public."ContestResult" USING btree ("userId");


--
-- Name: Contest_contestType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Contest_contestType_idx" ON public."Contest" USING btree ("contestType");


--
-- Name: Contest_sport_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Contest_sport_idx" ON public."Contest" USING btree (sport);


--
-- Name: Contest_startTime_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Contest_startTime_idx" ON public."Contest" USING btree ("startTime");


--
-- Name: Contest_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Contest_status_idx" ON public."Contest" USING btree (status);


--
-- Name: DFSLineupPlayer_dfsPlayerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DFSLineupPlayer_dfsPlayerId_idx" ON public."DFSLineupPlayer" USING btree ("dfsPlayerId");


--
-- Name: DFSLineupPlayer_lineupId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DFSLineupPlayer_lineupId_idx" ON public."DFSLineupPlayer" USING btree ("lineupId");


--
-- Name: DFSLineupPlayer_lineupId_slotPosition_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DFSLineupPlayer_lineupId_slotPosition_key" ON public."DFSLineupPlayer" USING btree ("lineupId", "slotPosition");


--
-- Name: DFSLineup_contestId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DFSLineup_contestId_idx" ON public."DFSLineup" USING btree ("contestId");


--
-- Name: DFSLineup_totalPoints_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DFSLineup_totalPoints_idx" ON public."DFSLineup" USING btree ("totalPoints");


--
-- Name: DFSLineup_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DFSLineup_userId_idx" ON public."DFSLineup" USING btree ("userId");


--
-- Name: DFSPlayer_contestId_externalPlayerId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DFSPlayer_contestId_externalPlayerId_key" ON public."DFSPlayer" USING btree ("contestId", "externalPlayerId");


--
-- Name: DFSPlayer_contestId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DFSPlayer_contestId_idx" ON public."DFSPlayer" USING btree ("contestId");


--
-- Name: DFSPlayer_position_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DFSPlayer_position_idx" ON public."DFSPlayer" USING btree ("position");


--
-- Name: DFSPlayer_projectedPoints_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DFSPlayer_projectedPoints_idx" ON public."DFSPlayer" USING btree ("projectedPoints");


--
-- Name: DFSPlayer_salary_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DFSPlayer_salary_idx" ON public."DFSPlayer" USING btree (salary);


--
-- Name: DraftBoard_draftId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DraftBoard_draftId_idx" ON public."DraftBoard" USING btree ("draftId");


--
-- Name: DraftBoard_draftId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DraftBoard_draftId_key" ON public."DraftBoard" USING btree ("draftId");


--
-- Name: DraftParticipant_draftId_draftPosition_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DraftParticipant_draftId_draftPosition_key" ON public."DraftParticipant" USING btree ("draftId", "draftPosition");


--
-- Name: DraftParticipant_draftId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DraftParticipant_draftId_idx" ON public."DraftParticipant" USING btree ("draftId");


--
-- Name: DraftParticipant_draftId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DraftParticipant_draftId_userId_key" ON public."DraftParticipant" USING btree ("draftId", "userId");


--
-- Name: DraftParticipant_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DraftParticipant_userId_idx" ON public."DraftParticipant" USING btree ("userId");


--
-- Name: DraftPick_draftId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DraftPick_draftId_idx" ON public."DraftPick" USING btree ("draftId");


--
-- Name: DraftPick_draftId_round_pickInRound_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DraftPick_draftId_round_pickInRound_key" ON public."DraftPick" USING btree ("draftId", round, "pickInRound");


--
-- Name: DraftPick_participantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DraftPick_participantId_idx" ON public."DraftPick" USING btree ("participantId");


--
-- Name: DraftPick_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DraftPick_userId_idx" ON public."DraftPick" USING btree ("userId");


--
-- Name: Draft_draftType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Draft_draftType_idx" ON public."Draft" USING btree ("draftType");


--
-- Name: Draft_scheduledStart_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Draft_scheduledStart_idx" ON public."Draft" USING btree ("scheduledStart");


--
-- Name: Draft_sport_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Draft_sport_idx" ON public."Draft" USING btree (sport);


--
-- Name: Draft_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Draft_status_idx" ON public."Draft" USING btree (status);


--
-- Name: EscrowAccount_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EscrowAccount_status_idx" ON public."EscrowAccount" USING btree (status);


--
-- Name: EscrowTransaction_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EscrowTransaction_status_idx" ON public."EscrowTransaction" USING btree (status);


--
-- Name: EscrowTransaction_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EscrowTransaction_type_idx" ON public."EscrowTransaction" USING btree (type);


--
-- Name: EscrowTransaction_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EscrowTransaction_userId_idx" ON public."EscrowTransaction" USING btree ("userId");


--
-- Name: Friendship_initiatorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Friendship_initiatorId_idx" ON public."Friendship" USING btree ("initiatorId");


--
-- Name: Friendship_initiatorId_recipientId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Friendship_initiatorId_recipientId_key" ON public."Friendship" USING btree ("initiatorId", "recipientId");


--
-- Name: Friendship_recipientId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Friendship_recipientId_idx" ON public."Friendship" USING btree ("recipientId");


--
-- Name: Friendship_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Friendship_status_idx" ON public."Friendship" USING btree (status);


--
-- Name: League_provider_providerId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "League_provider_providerId_key" ON public."League" USING btree (provider, "providerId");


--
-- Name: MemberWageringOptIn_userId_wageringSettingsId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "MemberWageringOptIn_userId_wageringSettingsId_key" ON public."MemberWageringOptIn" USING btree ("userId", "wageringSettingsId");


--
-- Name: Message_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_createdAt_idx" ON public."Message" USING btree ("createdAt");


--
-- Name: Message_draftId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_draftId_idx" ON public."Message" USING btree ("draftId");


--
-- Name: Message_leagueId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_leagueId_idx" ON public."Message" USING btree ("leagueId");


--
-- Name: Message_senderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_senderId_idx" ON public."Message" USING btree ("senderId");


--
-- Name: MockDraft_sport_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MockDraft_sport_idx" ON public."MockDraft" USING btree (sport);


--
-- Name: MockDraft_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MockDraft_userId_idx" ON public."MockDraft" USING btree ("userId");


--
-- Name: Notification_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_createdAt_idx" ON public."Notification" USING btree ("createdAt");


--
-- Name: Notification_isRead_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_isRead_idx" ON public."Notification" USING btree ("isRead");


--
-- Name: Notification_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_userId_idx" ON public."Notification" USING btree ("userId");


--
-- Name: OddsMovement_oddsId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OddsMovement_oddsId_idx" ON public."OddsMovement" USING btree ("oddsId");


--
-- Name: OddsMovement_timestamp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OddsMovement_timestamp_idx" ON public."OddsMovement" USING btree ("timestamp");


--
-- Name: PlayerPropHistory_gameDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PlayerPropHistory_gameDate_idx" ON public."PlayerPropHistory" USING btree ("gameDate");


--
-- Name: PlayerPropHistory_playerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PlayerPropHistory_playerId_idx" ON public."PlayerPropHistory" USING btree ("playerId");


--
-- Name: PlayerPropHistory_propType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PlayerPropHistory_propType_idx" ON public."PlayerPropHistory" USING btree ("propType");


--
-- Name: Player_externalId_leagueId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Player_externalId_leagueId_key" ON public."Player" USING btree ("externalId", "leagueId");


--
-- Name: Reaction_activityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Reaction_activityId_idx" ON public."Reaction" USING btree ("activityId");


--
-- Name: Reaction_messageId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Reaction_messageId_idx" ON public."Reaction" USING btree ("messageId");


--
-- Name: Reaction_userId_activityId_reactionType_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Reaction_userId_activityId_reactionType_key" ON public."Reaction" USING btree ("userId", "activityId", "reactionType");


--
-- Name: Reaction_userId_messageId_reactionType_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Reaction_userId_messageId_reactionType_key" ON public."Reaction" USING btree ("userId", "messageId", "reactionType");


--
-- Name: Roster_teamId_playerId_week_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Roster_teamId_playerId_week_key" ON public."Roster" USING btree ("teamId", "playerId", week);


--
-- Name: Subscription_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Subscription_userId_key" ON public."Subscription" USING btree ("userId");


--
-- Name: UserPreferences_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UserPreferences_userId_key" ON public."UserPreferences" USING btree ("userId");


--
-- Name: UserSubscription_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UserSubscription_userId_idx" ON public."UserSubscription" USING btree ("userId");


--
-- Name: UserWallet_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UserWallet_userId_key" ON public."UserWallet" USING btree ("userId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: ValueSnapshot_playerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ValueSnapshot_playerId_idx" ON public."ValueSnapshot" USING btree ("playerId");


--
-- Name: ValueSnapshot_timestamp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ValueSnapshot_timestamp_idx" ON public."ValueSnapshot" USING btree ("timestamp");


--
-- Name: WagerPlayer_wagerId_playerId_side_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "WagerPlayer_wagerId_playerId_side_key" ON public."WagerPlayer" USING btree ("wagerId", "playerId", side);


--
-- Name: WagerUpdate_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WagerUpdate_type_idx" ON public."WagerUpdate" USING btree (type);


--
-- Name: WagerUpdate_wagerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WagerUpdate_wagerId_idx" ON public."WagerUpdate" USING btree ("wagerId");


--
-- Name: Wager_creatorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Wager_creatorId_idx" ON public."Wager" USING btree ("creatorId");


--
-- Name: Wager_escrowId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Wager_escrowId_key" ON public."Wager" USING btree ("escrowId");


--
-- Name: Wager_opponentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Wager_opponentId_idx" ON public."Wager" USING btree ("opponentId");


--
-- Name: Wager_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Wager_status_idx" ON public."Wager" USING btree (status);


--
-- Name: Wager_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Wager_type_idx" ON public."Wager" USING btree (type);


--
-- Name: WageringSettings_leagueId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "WageringSettings_leagueId_key" ON public."WageringSettings" USING btree ("leagueId");


--
-- Name: ActivityItem ActivityItem_leagueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ActivityItem"
    ADD CONSTRAINT "ActivityItem_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES public."League"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ActivityItem ActivityItem_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ActivityItem"
    ADD CONSTRAINT "ActivityItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Alert Alert_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Alert"
    ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BettingInsight BettingInsight_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BettingInsight"
    ADD CONSTRAINT "BettingInsight_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BettingOdds BettingOdds_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BettingOdds"
    ADD CONSTRAINT "BettingOdds_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BettingSelection BettingSelection_bettingSlipId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BettingSelection"
    ADD CONSTRAINT "BettingSelection_bettingSlipId_fkey" FOREIGN KEY ("bettingSlipId") REFERENCES public."BettingSlip"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BettingSelection BettingSelection_oddsId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BettingSelection"
    ADD CONSTRAINT "BettingSelection_oddsId_fkey" FOREIGN KEY ("oddsId") REFERENCES public."BettingOdds"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BettingSlip BettingSlip_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BettingSlip"
    ADD CONSTRAINT "BettingSlip_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BountyParticipant BountyParticipant_bountyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BountyParticipant"
    ADD CONSTRAINT "BountyParticipant_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES public."Bounty"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BountyParticipant BountyParticipant_participantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BountyParticipant"
    ADD CONSTRAINT "BountyParticipant_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BountyUpdate BountyUpdate_bountyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BountyUpdate"
    ADD CONSTRAINT "BountyUpdate_bountyId_fkey" FOREIGN KEY ("bountyId") REFERENCES public."Bounty"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Bounty Bounty_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Bounty"
    ADD CONSTRAINT "Bounty_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Bounty Bounty_escrowId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Bounty"
    ADD CONSTRAINT "Bounty_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES public."EscrowAccount"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Bounty Bounty_leagueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Bounty"
    ADD CONSTRAINT "Bounty_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES public."League"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Bounty Bounty_winnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Bounty"
    ADD CONSTRAINT "Bounty_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ContestEntry ContestEntry_contestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContestEntry"
    ADD CONSTRAINT "ContestEntry_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES public."Contest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ContestEntry ContestEntry_lineupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContestEntry"
    ADD CONSTRAINT "ContestEntry_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES public."DFSLineup"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ContestEntry ContestEntry_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContestEntry"
    ADD CONSTRAINT "ContestEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ContestResult ContestResult_contestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContestResult"
    ADD CONSTRAINT "ContestResult_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES public."Contest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ContestResult ContestResult_entryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContestResult"
    ADD CONSTRAINT "ContestResult_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES public."ContestEntry"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ContestResult ContestResult_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContestResult"
    ADD CONSTRAINT "ContestResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DFSLineupPlayer DFSLineupPlayer_dfsPlayerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DFSLineupPlayer"
    ADD CONSTRAINT "DFSLineupPlayer_dfsPlayerId_fkey" FOREIGN KEY ("dfsPlayerId") REFERENCES public."DFSPlayer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DFSLineupPlayer DFSLineupPlayer_lineupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DFSLineupPlayer"
    ADD CONSTRAINT "DFSLineupPlayer_lineupId_fkey" FOREIGN KEY ("lineupId") REFERENCES public."DFSLineup"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DFSLineup DFSLineup_contestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DFSLineup"
    ADD CONSTRAINT "DFSLineup_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES public."Contest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DFSLineup DFSLineup_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DFSLineup"
    ADD CONSTRAINT "DFSLineup_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DFSPlayer DFSPlayer_contestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DFSPlayer"
    ADD CONSTRAINT "DFSPlayer_contestId_fkey" FOREIGN KEY ("contestId") REFERENCES public."Contest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DraftBoard DraftBoard_draftId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DraftBoard"
    ADD CONSTRAINT "DraftBoard_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES public."Draft"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DraftParticipant DraftParticipant_draftId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DraftParticipant"
    ADD CONSTRAINT "DraftParticipant_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES public."Draft"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DraftParticipant DraftParticipant_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DraftParticipant"
    ADD CONSTRAINT "DraftParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DraftPick DraftPick_draftId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DraftPick"
    ADD CONSTRAINT "DraftPick_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES public."Draft"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DraftPick DraftPick_participantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DraftPick"
    ADD CONSTRAINT "DraftPick_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES public."DraftParticipant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DraftPick DraftPick_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DraftPick"
    ADD CONSTRAINT "DraftPick_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Draft Draft_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Draft"
    ADD CONSTRAINT "Draft_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Draft Draft_leagueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Draft"
    ADD CONSTRAINT "Draft_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES public."League"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EscrowAccount EscrowAccount_releasedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EscrowAccount"
    ADD CONSTRAINT "EscrowAccount_releasedToId_fkey" FOREIGN KEY ("releasedToId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EscrowTransaction EscrowTransaction_escrowId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EscrowTransaction"
    ADD CONSTRAINT "EscrowTransaction_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES public."EscrowAccount"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EscrowTransaction EscrowTransaction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EscrowTransaction"
    ADD CONSTRAINT "EscrowTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Friendship Friendship_initiatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Friendship"
    ADD CONSTRAINT "Friendship_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Friendship Friendship_recipientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Friendship"
    ADD CONSTRAINT "Friendship_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: League League_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."League"
    ADD CONSTRAINT "League_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MemberWageringOptIn MemberWageringOptIn_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MemberWageringOptIn"
    ADD CONSTRAINT "MemberWageringOptIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MemberWageringOptIn MemberWageringOptIn_wageringSettingsId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MemberWageringOptIn"
    ADD CONSTRAINT "MemberWageringOptIn_wageringSettingsId_fkey" FOREIGN KEY ("wageringSettingsId") REFERENCES public."WageringSettings"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_draftId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES public."Draft"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_leagueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES public."League"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Message Message_recipientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MockDraft MockDraft_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MockDraft"
    ADD CONSTRAINT "MockDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OddsMovement OddsMovement_oddsId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OddsMovement"
    ADD CONSTRAINT "OddsMovement_oddsId_fkey" FOREIGN KEY ("oddsId") REFERENCES public."BettingOdds"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PlayerPropHistory PlayerPropHistory_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PlayerPropHistory"
    ADD CONSTRAINT "PlayerPropHistory_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Player Player_leagueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Player"
    ADD CONSTRAINT "Player_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES public."League"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Prediction Prediction_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Prediction"
    ADD CONSTRAINT "Prediction_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Prediction Prediction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Prediction"
    ADD CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Reaction Reaction_activityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reaction"
    ADD CONSTRAINT "Reaction_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES public."ActivityItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Reaction Reaction_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reaction"
    ADD CONSTRAINT "Reaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Reaction Reaction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reaction"
    ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Roster Roster_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Roster"
    ADD CONSTRAINT "Roster_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Roster Roster_teamId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Roster"
    ADD CONSTRAINT "Roster_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES public."Team"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Subscription Subscription_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subscription"
    ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Team Team_leagueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Team"
    ADD CONSTRAINT "Team_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES public."League"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Team Team_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Team"
    ADD CONSTRAINT "Team_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserPreferences UserPreferences_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserPreferences"
    ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserSubscription UserSubscription_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserSubscription"
    ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserWallet UserWallet_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserWallet"
    ADD CONSTRAINT "UserWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ValueSnapshot ValueSnapshot_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ValueSnapshot"
    ADD CONSTRAINT "ValueSnapshot_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WagerPlayer WagerPlayer_playerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WagerPlayer"
    ADD CONSTRAINT "WagerPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES public."Player"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WagerPlayer WagerPlayer_wagerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WagerPlayer"
    ADD CONSTRAINT "WagerPlayer_wagerId_fkey" FOREIGN KEY ("wagerId") REFERENCES public."Wager"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: WagerUpdate WagerUpdate_wagerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WagerUpdate"
    ADD CONSTRAINT "WagerUpdate_wagerId_fkey" FOREIGN KEY ("wagerId") REFERENCES public."Wager"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Wager Wager_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wager"
    ADD CONSTRAINT "Wager_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Wager Wager_escrowId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wager"
    ADD CONSTRAINT "Wager_escrowId_fkey" FOREIGN KEY ("escrowId") REFERENCES public."EscrowAccount"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Wager Wager_leagueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wager"
    ADD CONSTRAINT "Wager_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES public."League"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Wager Wager_opponentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wager"
    ADD CONSTRAINT "Wager_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Wager Wager_winnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Wager"
    ADD CONSTRAINT "Wager_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WageringSettings WageringSettings_leagueId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WageringSettings"
    ADD CONSTRAINT "WageringSettings_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES public."League"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

