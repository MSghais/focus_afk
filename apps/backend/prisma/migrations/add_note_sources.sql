-- Create NoteSource table
CREATE TABLE "note_sources" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "url" TEXT,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "note_sources_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "note_sources" ADD CONSTRAINT "note_sources_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add index for better query performance
CREATE INDEX "note_sources_noteId_idx" ON "note_sources"("noteId");
CREATE INDEX "note_sources_type_idx" ON "note_sources"("type"); 