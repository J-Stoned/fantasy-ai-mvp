/**
 * Database String Literal Types
 * These match the actual database schema after syncing with production
 */

// Sport types
export type Sport = "FOOTBALL" | "BASKETBALL" | "BASEBALL" | "HOCKEY";

// Provider types
export type Provider = "yahoo" | "espn" | "cbs" | "sleeper";

// Status types
export type Status = "ACTIVE" | "INACTIVE" | "PENDING" | "COMPLETED" | "CANCELLED" | "DRAFT" | "OPEN" | "CLOSED" | "RUNNING" | "ERROR";

// Tier types
export type Tier = "FREE" | "PRO" | "ELITE";

// Contest status
export type ContestStatus = "UPCOMING" | "LIVE" | "COMPLETED" | "CANCELLED";

// Draft status
export type DraftStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

// Betting status
export type BettingStatus = "PENDING" | "WON" | "LOST" | "PUSH" | "CANCELLED";

// Wagering status
export type WagerStatus = "OPEN" | "ACCEPTED" | "COMPLETED" | "CANCELLED" | "EXPIRED";

// Message types
export type MessageType = "TEXT" | "IMAGE" | "SYSTEM" | "TRADE" | "WAGER";

// Activity types
export type ActivityType = "TRADE" | "WAGER" | "MESSAGE" | "ACHIEVEMENT" | "SYSTEM";

// Sync status
export type SyncStatus = "SUCCESS" | "FAILED" | "IN_PROGRESS" | "PENDING";

// Constants for easy reference
export const SPORTS = {
  FOOTBALL: "FOOTBALL" as Sport,
  BASKETBALL: "BASKETBALL" as Sport,
  BASEBALL: "BASEBALL" as Sport,
  HOCKEY: "HOCKEY" as Sport,
} as const;

export const PROVIDERS = {
  YAHOO: "yahoo" as Provider,
  ESPN: "espn" as Provider,
  CBS: "cbs" as Provider,
  SLEEPER: "sleeper" as Provider,
} as const;

export const TIERS = {
  FREE: "FREE" as Tier,
  PRO: "PRO" as Tier,
  ELITE: "ELITE" as Tier,
} as const;