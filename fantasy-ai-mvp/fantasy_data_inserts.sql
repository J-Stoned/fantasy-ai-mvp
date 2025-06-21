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

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public."User" DISABLE TRIGGER ALL;

INSERT INTO public."User" VALUES ('cmc48p2j00000und9katziiga', 'demo@fantasy.ai', 'Demo User', NULL, 'demo123', '2025-06-20 03:17:49.451', '2025-06-20 03:17:49.451');


ALTER TABLE public."User" ENABLE TRIGGER ALL;

--
-- Data for Name: League; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."League" DISABLE TRIGGER ALL;

INSERT INTO public."League" VALUES ('cmc48p2kc0002und95mwb94cj', 'cmc48p2j00000und9katziiga', 'YAHOO', 'demo-league-001', 'Fantasy.AI Pro League', '2025', 'FOOTBALL', true, '{"scoring": {"passingTDs": 4, "receptions": 1, "rushingTDs": 6, "passingYards": 0.04, "receivingTDs": 6, "rushingYards": 0.1, "receivingYards": 0.1}, "positions": ["QB", "RB", "RB", "WR", "WR", "WR", "TE", "FLEX", "DEF", "K"]}', NULL, '2025-06-20 03:17:49.5', '2025-06-20 03:17:49.5', false);


ALTER TABLE public."League" ENABLE TRIGGER ALL;

--
-- Data for Name: ActivityItem; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."ActivityItem" DISABLE TRIGGER ALL;



ALTER TABLE public."ActivityItem" ENABLE TRIGGER ALL;

--
-- Data for Name: Alert; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Alert" DISABLE TRIGGER ALL;



ALTER TABLE public."Alert" ENABLE TRIGGER ALL;

--
-- Data for Name: Player; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Player" DISABLE TRIGGER ALL;

INSERT INTO public."Player" VALUES ('cmc48plf50003unfjdufoc9zj', 'yahoo_player_1', 'Josh Allen', 'QB', 'Buffalo Bills', 'cmc48p2kc0002und95mwb94cj', '{"points": 28.4, "passingTDs": 29, "rushingTDs": 5, "gamesPlayed": 12, "passingYards": 3524, "rushingYards": 421}', '{"points": 24.7, "confidence": 0.91, "passingTDs": 2.4, "passingYards": 285}', NULL, NULL, '2025-06-20 03:18:13.938', '2025-06-20 03:18:13.938');
INSERT INTO public."Player" VALUES ('cmc48plfe0004unfj883qei73', 'yahoo_player_2', 'Christian McCaffrey', 'RB', 'San Francisco 49ers', 'cmc48p2kc0002und95mwb94cj', '{"points": 22.3, "receptions": 58, "rushingTDs": 11, "gamesPlayed": 11, "rushingYards": 1023, "receivingYards": 489}', '{"points": 18.9, "confidence": 0.78, "receptions": 5.2, "rushingYards": 95}', NULL, NULL, '2025-06-20 03:18:13.946', '2025-06-20 03:18:13.946');
INSERT INTO public."Player" VALUES ('cmc48plfh0005unfji2ydz7io', 'yahoo_player_3', 'Tyreek Hill', 'WR', 'Miami Dolphins', 'cmc48p2kc0002und95mwb94cj', '{"points": 19.8, "receptions": 89, "gamesPlayed": 12, "receivingTDs": 9, "receivingYards": 1324}', '{"points": 16.8, "confidence": 0.85, "receptions": 7.4, "receivingYards": 110}', NULL, NULL, '2025-06-20 03:18:13.949', '2025-06-20 03:18:13.949');
INSERT INTO public."Player" VALUES ('cmc48plfl0006unfji0gzjim3', 'yahoo_player_4', 'Travis Kelce', 'TE', 'Kansas City Chiefs', 'cmc48p2kc0002und95mwb94cj', '{"points": 15.6, "receptions": 78, "gamesPlayed": 12, "receivingTDs": 7, "receivingYards": 924}', '{"points": 14.2, "confidence": 0.88, "receptions": 6.5, "receivingYards": 77}', NULL, NULL, '2025-06-20 03:18:13.953', '2025-06-20 03:18:13.953');
INSERT INTO public."Player" VALUES ('cmc48plfo0007unfjeh4mytem', 'yahoo_player_5', 'Cooper Kupp', 'WR', 'Los Angeles Rams', 'cmc48p2kc0002und95mwb94cj', '{"points": 17.4, "receptions": 72, "gamesPlayed": 10, "receivingTDs": 8, "receivingYards": 987}', '{"points": 15.3, "confidence": 0.82, "receptions": 7.2, "receivingYards": 98}', NULL, NULL, '2025-06-20 03:18:13.956', '2025-06-20 03:18:13.956');
INSERT INTO public."Player" VALUES ('cmc48plfr0008unfjljtb381s', 'yahoo_player_6', 'Derrick Henry', 'RB', 'Tennessee Titans', 'cmc48p2kc0002und95mwb94cj', '{"points": 18.2, "receptions": 21, "rushingTDs": 10, "gamesPlayed": 12, "rushingYards": 1134, "receivingYards": 189}', '{"points": 16.5, "confidence": 0.76, "rushingTDs": 0.8, "rushingYards": 94}', NULL, NULL, '2025-06-20 03:18:13.96', '2025-06-20 03:18:13.96');
INSERT INTO public."Player" VALUES ('cmc48plfv0009unfjq60ia9dk', 'yahoo_player_7', 'Justin Jefferson', 'WR', 'Minnesota Vikings', 'cmc48p2kc0002und95mwb94cj', '{"points": 20.1, "receptions": 98, "gamesPlayed": 12, "receivingTDs": 10, "receivingYards": 1456}', '{"points": 18.2, "confidence": 0.89, "receptions": 8.2, "receivingYards": 121}', NULL, NULL, '2025-06-20 03:18:13.963', '2025-06-20 03:18:13.963');
INSERT INTO public."Player" VALUES ('cmc48plfy000aunfjb0s62b8l', 'yahoo_player_8', 'Patrick Mahomes', 'QB', 'Kansas City Chiefs', 'cmc48p2kc0002und95mwb94cj', '{"points": 26.7, "passingTDs": 31, "rushingTDs": 3, "gamesPlayed": 12, "passingYards": 3789, "rushingYards": 234}', '{"points": 23.4, "confidence": 0.93, "passingTDs": 2.6, "passingYards": 315}', NULL, NULL, '2025-06-20 03:18:13.966', '2025-06-20 03:18:13.966');


ALTER TABLE public."Player" ENABLE TRIGGER ALL;

--
-- Data for Name: BettingInsight; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."BettingInsight" DISABLE TRIGGER ALL;



ALTER TABLE public."BettingInsight" ENABLE TRIGGER ALL;

--
-- Data for Name: BettingOdds; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."BettingOdds" DISABLE TRIGGER ALL;



ALTER TABLE public."BettingOdds" ENABLE TRIGGER ALL;

--
-- Data for Name: BettingSlip; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."BettingSlip" DISABLE TRIGGER ALL;



ALTER TABLE public."BettingSlip" ENABLE TRIGGER ALL;

--
-- Data for Name: BettingSelection; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."BettingSelection" DISABLE TRIGGER ALL;



ALTER TABLE public."BettingSelection" ENABLE TRIGGER ALL;

--
-- Data for Name: EscrowAccount; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."EscrowAccount" DISABLE TRIGGER ALL;



ALTER TABLE public."EscrowAccount" ENABLE TRIGGER ALL;

--
-- Data for Name: Bounty; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Bounty" DISABLE TRIGGER ALL;



ALTER TABLE public."Bounty" ENABLE TRIGGER ALL;

--
-- Data for Name: BountyParticipant; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."BountyParticipant" DISABLE TRIGGER ALL;



ALTER TABLE public."BountyParticipant" ENABLE TRIGGER ALL;

--
-- Data for Name: BountyUpdate; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."BountyUpdate" DISABLE TRIGGER ALL;



ALTER TABLE public."BountyUpdate" ENABLE TRIGGER ALL;

--
-- Data for Name: Contest; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Contest" DISABLE TRIGGER ALL;



ALTER TABLE public."Contest" ENABLE TRIGGER ALL;

--
-- Data for Name: DFSLineup; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."DFSLineup" DISABLE TRIGGER ALL;



ALTER TABLE public."DFSLineup" ENABLE TRIGGER ALL;

--
-- Data for Name: ContestEntry; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."ContestEntry" DISABLE TRIGGER ALL;



ALTER TABLE public."ContestEntry" ENABLE TRIGGER ALL;

--
-- Data for Name: ContestResult; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."ContestResult" DISABLE TRIGGER ALL;



ALTER TABLE public."ContestResult" ENABLE TRIGGER ALL;

--
-- Data for Name: DFSPlayer; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."DFSPlayer" DISABLE TRIGGER ALL;



ALTER TABLE public."DFSPlayer" ENABLE TRIGGER ALL;

--
-- Data for Name: DFSLineupPlayer; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."DFSLineupPlayer" DISABLE TRIGGER ALL;



ALTER TABLE public."DFSLineupPlayer" ENABLE TRIGGER ALL;

--
-- Data for Name: Draft; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Draft" DISABLE TRIGGER ALL;



ALTER TABLE public."Draft" ENABLE TRIGGER ALL;

--
-- Data for Name: DraftBoard; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."DraftBoard" DISABLE TRIGGER ALL;



ALTER TABLE public."DraftBoard" ENABLE TRIGGER ALL;

--
-- Data for Name: DraftParticipant; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."DraftParticipant" DISABLE TRIGGER ALL;



ALTER TABLE public."DraftParticipant" ENABLE TRIGGER ALL;

--
-- Data for Name: DraftPick; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."DraftPick" DISABLE TRIGGER ALL;



ALTER TABLE public."DraftPick" ENABLE TRIGGER ALL;

--
-- Data for Name: EscrowTransaction; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."EscrowTransaction" DISABLE TRIGGER ALL;



ALTER TABLE public."EscrowTransaction" ENABLE TRIGGER ALL;

--
-- Data for Name: Friendship; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Friendship" DISABLE TRIGGER ALL;



ALTER TABLE public."Friendship" ENABLE TRIGGER ALL;

--
-- Data for Name: WageringSettings; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."WageringSettings" DISABLE TRIGGER ALL;



ALTER TABLE public."WageringSettings" ENABLE TRIGGER ALL;

--
-- Data for Name: MemberWageringOptIn; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."MemberWageringOptIn" DISABLE TRIGGER ALL;



ALTER TABLE public."MemberWageringOptIn" ENABLE TRIGGER ALL;

--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Message" DISABLE TRIGGER ALL;



ALTER TABLE public."Message" ENABLE TRIGGER ALL;

--
-- Data for Name: MockDraft; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."MockDraft" DISABLE TRIGGER ALL;



ALTER TABLE public."MockDraft" ENABLE TRIGGER ALL;

--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Notification" DISABLE TRIGGER ALL;



ALTER TABLE public."Notification" ENABLE TRIGGER ALL;

--
-- Data for Name: OddsMovement; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."OddsMovement" DISABLE TRIGGER ALL;



ALTER TABLE public."OddsMovement" ENABLE TRIGGER ALL;

--
-- Data for Name: PlayerPropHistory; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."PlayerPropHistory" DISABLE TRIGGER ALL;



ALTER TABLE public."PlayerPropHistory" ENABLE TRIGGER ALL;

--
-- Data for Name: Prediction; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Prediction" DISABLE TRIGGER ALL;



ALTER TABLE public."Prediction" ENABLE TRIGGER ALL;

--
-- Data for Name: Reaction; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Reaction" DISABLE TRIGGER ALL;



ALTER TABLE public."Reaction" ENABLE TRIGGER ALL;

--
-- Data for Name: Team; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Team" DISABLE TRIGGER ALL;



ALTER TABLE public."Team" ENABLE TRIGGER ALL;

--
-- Data for Name: Roster; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Roster" DISABLE TRIGGER ALL;



ALTER TABLE public."Roster" ENABLE TRIGGER ALL;

--
-- Data for Name: Subscription; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Subscription" DISABLE TRIGGER ALL;



ALTER TABLE public."Subscription" ENABLE TRIGGER ALL;

--
-- Data for Name: UserPreferences; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."UserPreferences" DISABLE TRIGGER ALL;



ALTER TABLE public."UserPreferences" ENABLE TRIGGER ALL;

--
-- Data for Name: UserSubscription; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."UserSubscription" DISABLE TRIGGER ALL;



ALTER TABLE public."UserSubscription" ENABLE TRIGGER ALL;

--
-- Data for Name: UserWallet; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."UserWallet" DISABLE TRIGGER ALL;



ALTER TABLE public."UserWallet" ENABLE TRIGGER ALL;

--
-- Data for Name: ValueSnapshot; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."ValueSnapshot" DISABLE TRIGGER ALL;



ALTER TABLE public."ValueSnapshot" ENABLE TRIGGER ALL;

--
-- Data for Name: Wager; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."Wager" DISABLE TRIGGER ALL;



ALTER TABLE public."Wager" ENABLE TRIGGER ALL;

--
-- Data for Name: WagerPlayer; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."WagerPlayer" DISABLE TRIGGER ALL;



ALTER TABLE public."WagerPlayer" ENABLE TRIGGER ALL;

--
-- Data for Name: WagerUpdate; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public."WagerUpdate" DISABLE TRIGGER ALL;



ALTER TABLE public."WagerUpdate" ENABLE TRIGGER ALL;

--
-- Data for Name: subscription_usage; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.subscription_usage DISABLE TRIGGER ALL;



ALTER TABLE public.subscription_usage ENABLE TRIGGER ALL;

--
-- PostgreSQL database dump complete
--

