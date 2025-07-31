-- Add gamification fields to users table
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "level" INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS "totalXp" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "streak" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "longestStreak" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "totalFocusMinutes" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "completedQuests" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "earnedBadges" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "totalTokens" INTEGER DEFAULT 0;

-- Add gamification fields to quests table
ALTER TABLE "quests" 
ADD COLUMN IF NOT EXISTS "rewardTokens" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Add gamification fields to badges table
ALTER TABLE "badges" 
ADD COLUMN IF NOT EXISTS "rarity" TEXT DEFAULT 'common',
ADD COLUMN IF NOT EXISTS "xpReward" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "tokenReward" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to have default values
UPDATE "users" SET 
  "level" = COALESCE("level", 1),
  "totalXp" = COALESCE("totalXp", 0),
  "streak" = COALESCE("streak", 0),
  "longestStreak" = COALESCE("longestStreak", 0),
  "totalFocusMinutes" = COALESCE("totalFocusMinutes", 0),
  "completedQuests" = COALESCE("completedQuests", 0),
  "earnedBadges" = COALESCE("earnedBadges", 0),
  "totalTokens" = COALESCE("totalTokens", 0);

UPDATE "quests" SET 
  "rewardTokens" = COALESCE("rewardTokens", 0),
  "createdAt" = COALESCE("createdAt", "dateAwarded"),
  "updatedAt" = COALESCE("updatedAt", "dateAwarded");

UPDATE "badges" SET 
  "rarity" = COALESCE("rarity", 'common'),
  "xpReward" = COALESCE("xpReward", 0),
  "tokenReward" = COALESCE("tokenReward", 0),
  "createdAt" = COALESCE("createdAt", "dateAwarded"),
  "updatedAt" = COALESCE("updatedAt", "dateAwarded"); 