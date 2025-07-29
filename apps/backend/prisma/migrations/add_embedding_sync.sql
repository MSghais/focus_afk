-- Add embedding sync tracking table
CREATE TABLE "embedding_sync" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "lastSyncAt" TIMESTAMP(3) NOT NULL,
  "syncStatus" TEXT NOT NULL DEFAULT 'pending',
  "dataTypes" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "embedding_sync_pkey" PRIMARY KEY ("id")
);

-- Add index for efficient lookups
CREATE INDEX "embedding_sync_userId_idx" ON "embedding_sync"("userId");

-- Add unique constraint to ensure one sync record per user
ALTER TABLE "embedding_sync" ADD CONSTRAINT "embedding_sync_userId_unique" UNIQUE ("userId");

-- Add foreign key constraint
ALTER TABLE "embedding_sync" ADD CONSTRAINT "embedding_sync_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; 