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
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, email, name, image, password, "createdAt", "updatedAt") FROM stdin;
cmc48p2j00000und9katziiga	demo@fantasy.ai	Demo User	\N	demo123	2025-06-20 03:17:49.451	2025-06-20 03:17:49.451
\.


--
-- Data for Name: League; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."League" (id, "userId", provider, "providerId", name, season, sport, "isActive", settings, "lastSync", "createdAt", "updatedAt", "wageringEnabled") FROM stdin;
cmc48p2kc0002und95mwb94cj	cmc48p2j00000und9katziiga	YAHOO	demo-league-001	Fantasy.AI Pro League	2025	FOOTBALL	t	{"scoring": {"passingTDs": 4, "receptions": 1, "rushingTDs": 6, "passingYards": 0.04, "receivingTDs": 6, "rushingYards": 0.1, "receivingYards": 0.1}, "positions": ["QB", "RB", "RB", "WR", "WR", "WR", "TE", "FLEX", "DEF", "K"]}	\N	2025-06-20 03:17:49.5	2025-06-20 03:17:49.5	f
\.


--
-- Data for Name: ActivityItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ActivityItem" (id, "userId", "leagueId", "activityType", title, description, metadata, "isPublic", "createdAt") FROM stdin;
\.


--
-- Data for Name: Alert; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Alert" (id, "userId", type, title, message, data, read, "createdAt") FROM stdin;
\.


--
-- Data for Name: Player; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Player" (id, "externalId", name, "position", team, "leagueId", stats, projections, "injuryStatus", "imageUrl", "createdAt", "updatedAt") FROM stdin;
cmc48plf50003unfjdufoc9zj	yahoo_player_1	Josh Allen	QB	Buffalo Bills	cmc48p2kc0002und95mwb94cj	{"points": 28.4, "passingTDs": 29, "rushingTDs": 5, "gamesPlayed": 12, "passingYards": 3524, "rushingYards": 421}	{"points": 24.7, "confidence": 0.91, "passingTDs": 2.4, "passingYards": 285}	\N	\N	2025-06-20 03:18:13.938	2025-06-20 03:18:13.938
cmc48plfe0004unfj883qei73	yahoo_player_2	Christian McCaffrey	RB	San Francisco 49ers	cmc48p2kc0002und95mwb94cj	{"points": 22.3, "receptions": 58, "rushingTDs": 11, "gamesPlayed": 11, "rushingYards": 1023, "receivingYards": 489}	{"points": 18.9, "confidence": 0.78, "receptions": 5.2, "rushingYards": 95}	\N	\N	2025-06-20 03:18:13.946	2025-06-20 03:18:13.946
cmc48plfh0005unfji2ydz7io	yahoo_player_3	Tyreek Hill	WR	Miami Dolphins	cmc48p2kc0002und95mwb94cj	{"points": 19.8, "receptions": 89, "gamesPlayed": 12, "receivingTDs": 9, "receivingYards": 1324}	{"points": 16.8, "confidence": 0.85, "receptions": 7.4, "receivingYards": 110}	\N	\N	2025-06-20 03:18:13.949	2025-06-20 03:18:13.949
cmc48plfl0006unfji0gzjim3	yahoo_player_4	Travis Kelce	TE	Kansas City Chiefs	cmc48p2kc0002und95mwb94cj	{"points": 15.6, "receptions": 78, "gamesPlayed": 12, "receivingTDs": 7, "receivingYards": 924}	{"points": 14.2, "confidence": 0.88, "receptions": 6.5, "receivingYards": 77}	\N	\N	2025-06-20 03:18:13.953	2025-06-20 03:18:13.953
cmc48plfo0007unfjeh4mytem	yahoo_player_5	Cooper Kupp	WR	Los Angeles Rams	cmc48p2kc0002und95mwb94cj	{"points": 17.4, "receptions": 72, "gamesPlayed": 10, "receivingTDs": 8, "receivingYards": 987}	{"points": 15.3, "confidence": 0.82, "receptions": 7.2, "receivingYards": 98}	\N	\N	2025-06-20 03:18:13.956	2025-06-20 03:18:13.956
cmc48plfr0008unfjljtb381s	yahoo_player_6	Derrick Henry	RB	Tennessee Titans	cmc48p2kc0002und95mwb94cj	{"points": 18.2, "receptions": 21, "rushingTDs": 10, "gamesPlayed": 12, "rushingYards": 1134, "receivingYards": 189}	{"points": 16.5, "confidence": 0.76, "rushingTDs": 0.8, "rushingYards": 94}	\N	\N	2025-06-20 03:18:13.96	2025-06-20 03:18:13.96
cmc48plfv0009unfjq60ia9dk	yahoo_player_7	Justin Jefferson	WR	Minnesota Vikings	cmc48p2kc0002und95mwb94cj	{"points": 20.1, "receptions": 98, "gamesPlayed": 12, "receivingTDs": 10, "receivingYards": 1456}	{"points": 18.2, "confidence": 0.89, "receptions": 8.2, "receivingYards": 121}	\N	\N	2025-06-20 03:18:13.963	2025-06-20 03:18:13.963
cmc48plfy000aunfjb0s62b8l	yahoo_player_8	Patrick Mahomes	QB	Kansas City Chiefs	cmc48p2kc0002und95mwb94cj	{"points": 26.7, "passingTDs": 31, "rushingTDs": 3, "gamesPlayed": 12, "passingYards": 3789, "rushingYards": 234}	{"points": 23.4, "confidence": 0.93, "passingTDs": 2.6, "passingYards": 315}	\N	\N	2025-06-20 03:18:13.966	2025-06-20 03:18:13.966
\.


--
-- Data for Name: BettingInsight; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BettingInsight" (id, "playerId", "propType", recommendation, confidence, reasoning, "keyFactors", "generatedAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: BettingOdds; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BettingOdds" (id, "playerId", "gameId", "propType", "propName", line, "overOdds", "underOdds", sportsbook, volume, "isLive", confidence, "createdAt", "lastUpdated") FROM stdin;
\.


--
-- Data for Name: BettingSlip; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BettingSlip" (id, "userId", "totalOdds", "potentialPayout", stake, status, "placedAt", "settledAt", "actualPayout") FROM stdin;
\.


--
-- Data for Name: BettingSelection; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BettingSelection" (id, "bettingSlipId", "oddsId", selection, line, "oddsValue", stake, "potentialPayout", "isWon", "actualResult") FROM stdin;
\.


--
-- Data for Name: EscrowAccount; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EscrowAccount" (id, "totalAmount", "creatorAmount", "opponentAmount", status, "stripePaymentIntentId", "releasedAt", "releasedToId", "refundedAt", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Bounty; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Bounty" (id, "creatorId", title, description, "bountyAmount", "targetMetric", timeframe, "startDate", "endDate", status, "maxParticipants", "isPublic", "escrowId", "winnerId", "settledAt", "leagueId", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BountyParticipant; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BountyParticipant" (id, "bountyId", "participantId", "stakeAmount", "currentScore", "joinedAt") FROM stdin;
\.


--
-- Data for Name: BountyUpdate; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BountyUpdate" (id, "bountyId", type, message, data, "createdAt") FROM stdin;
\.


--
-- Data for Name: Contest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Contest" (id, name, description, sport, "contestType", "entryFee", "totalPrizePool", "maxEntries", "currentEntries", "salaryCap", "startTime", "endTime", status, "isPublic", "isGuaranteed", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DFSLineup; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DFSLineup" (id, "userId", "contestId", name, "totalSalary", "totalPoints", "isOptimal", "isLocked", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ContestEntry; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ContestEntry" (id, "contestId", "userId", "lineupId", "entryNumber", "totalPoints", rank, payout, "createdAt") FROM stdin;
\.


--
-- Data for Name: ContestResult; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ContestResult" (id, "contestId", "userId", "entryId", "finalRank", "finalPoints", payout, "createdAt") FROM stdin;
\.


--
-- Data for Name: DFSPlayer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DFSPlayer" (id, "contestId", "externalPlayerId", name, team, "position", salary, "projectedPoints", "actualPoints", ownership, value, "gameTime", "isActive", "injuryStatus") FROM stdin;
\.


--
-- Data for Name: DFSLineupPlayer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DFSLineupPlayer" (id, "lineupId", "dfsPlayerId", "position", "slotPosition", salary, points) FROM stdin;
\.


--
-- Data for Name: Draft; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Draft" (id, "creatorId", "leagueId", name, description, sport, "draftType", "draftOrder", "totalRounds", "timePerPick", "isAuction", "auctionBudget", "isSnakeDraft", "isMockDraft", "isPublic", "maxParticipants", "scheduledStart", "actualStart", "endedAt", status, "currentRound", "currentPick", "currentPickerId", settings, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: DraftBoard; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DraftBoard" (id, "draftId", "availablePlayers", rankings, adp, projections, "lastUpdated") FROM stdin;
\.


--
-- Data for Name: DraftParticipant; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DraftParticipant" (id, "draftId", "userId", "draftPosition", "teamName", "isReady", "isAutoPick", timeouts, "totalSpent", "joinedAt") FROM stdin;
\.


--
-- Data for Name: DraftPick; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DraftPick" (id, "draftId", "participantId", "userId", "playerId", "playerName", "playerPosition", "playerTeam", round, pick, "pickInRound", "auctionPrice", "isKeeper", "pickTime", "timeToMake", "isAutoPick") FROM stdin;
\.


--
-- Data for Name: EscrowTransaction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EscrowTransaction" (id, "escrowId", "userId", type, amount, status, "stripeTransactionId", description, "processedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Friendship; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Friendship" (id, "initiatorId", "recipientId", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: WageringSettings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WageringSettings" (id, "leagueId", "enablePlayerTrading", "enableLiveBetting", "enableBounties", "enablePropBets", "enableCrypto", "minWagerAmount", "maxWagerAmount", "maxDailyWagerTotal", "requireCommissionerApproval", "allowGuestBetting", "blockedMembers", "wageringAdmins", "allowCrossLeagueBetting", "profitSharingPercent", "escrowHoldDays", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: MemberWageringOptIn; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MemberWageringOptIn" (id, "userId", "wageringSettingsId", "optedIn", "dailyLimit", "weeklyLimit", "allowLiveBetting", "allowPlayerTrades", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Message" (id, "senderId", "recipientId", "leagueId", "draftId", "messageType", content, attachments, "isEdited", "editedAt", "isDeleted", "deletedAt", "parentId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: MockDraft; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MockDraft" (id, "userId", sport, "draftType", "teamCount", rounds, "userPosition", results, "userTeam", "aiAnalysis", score, "completedAt") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Notification" (id, "userId", "notificationType", title, message, data, "isRead", "readAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: OddsMovement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OddsMovement" (id, "oddsId", "previousLine", "newLine", "previousOverOdds", "newOverOdds", "previousUnderOdds", "newUnderOdds", movement, trigger, "timestamp") FROM stdin;
\.


--
-- Data for Name: PlayerPropHistory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PlayerPropHistory" (id, "playerId", "gameId", "propType", line, "actualResult", hit, "gameDate", opponent) FROM stdin;
\.


--
-- Data for Name: Prediction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Prediction" (id, "userId", "playerId", type, week, season, prediction, confidence, actual, accuracy, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Reaction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Reaction" (id, "userId", "messageId", "activityId", "reactionType", "createdAt") FROM stdin;
\.


--
-- Data for Name: Team; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Team" (id, "userId", "leagueId", name, rank, points, wins, losses, ties, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Roster; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Roster" (id, "teamId", "playerId", "position", "isStarter", week, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Subscription; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Subscription" (id, "userId", tier, status, "startDate", "endDate", "stripeCustomerId", "stripeSubscriptionId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UserPreferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UserPreferences" (id, "userId", notifications, theme, "aiPersonality", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UserSubscription; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UserSubscription" (id, "userId", tier, status, "billingInterval", "currentPeriodStart", "currentPeriodEnd", "cancelAtPeriodEnd", "stripeSubscriptionId", "stripeCustomerId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UserWallet; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UserWallet" (id, "userId", balance, "lockedAmount", "stripeCustomerId", "defaultPaymentMethodId", "totalDeposited", "totalWithdrawn", "totalWon", "totalLost", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ValueSnapshot; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ValueSnapshot" (id, "playerId", "stockPrice", "timestamp", "wagerId", metadata) FROM stdin;
\.


--
-- Data for Name: Wager; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Wager" (id, "creatorId", "opponentId", type, status, title, description, "totalValue", "creatorStake", "opponentStake", performance, timeframe, "startDate", "endDate", "settledAt", "winnerId", "escrowId", "leagueId", "isPublic", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: WagerPlayer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WagerPlayer" (id, "wagerId", "playerId", side, "stockPrice", "currentValue", "isTraded", "createdAt") FROM stdin;
\.


--
-- Data for Name: WagerUpdate; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WagerUpdate" (id, "wagerId", type, message, data, "createdAt") FROM stdin;
\.


--
-- Data for Name: subscription_usage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.subscription_usage ("userId", period, "aiInsightsUsed", "voiceMinutesUsed", "leaguesCreated", "apiCallsMade", "lastUpdated") FROM stdin;
\.


--
-- PostgreSQL database dump complete
--

