const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function migrateNoteSources() {
  try {
    console.log('Creating NoteSource table...');
    
    // Create the note_sources table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "note_sources" (
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
    `;

    // Add foreign key constraint
    // await prisma.$executeRaw`
    //   ALTER TABLE "note_sources" 
    //   ADD CONSTRAINT "note_sources_noteId_fkey" 
    //   FOREIGN KEY ("noteId") REFERENCES "notes"("id") 
    //   ON DELETE CASCADE ON UPDATE CASCADE;
    // `;

    // // Add indexes
    // await prisma.$executeRaw`
    //   CREATE INDEX IF NOT EXISTS "note_sources_noteId_idx" ON "note_sources"("noteId");
    // `;
    
    // await prisma.$executeRaw`
    //   CREATE INDEX IF NOT EXISTS "note_sources_type_idx" ON "note_sources"("type");
    // `;

    console.log('✅ NoteSource table created successfully!');
    
    // Migrate existing string sources to structured sources
    console.log('Migrating existing sources...');
    const notes = await prisma.notes.findMany({
      where: {
        sources: {
          not: []
        }
      }
    });

    for (const note of notes) {
      if (note.sources && note.sources.length > 0) {
        const structuredSources = note.sources.map((source, index) => ({
          id: `migrated-${note.id}-${index}`,
          noteId: note.id,
          type: 'text', // Default to text for migrated sources
          title: `Migrated Source ${index + 1}`,
          content: source,
          url: null,
          fileType: null,
          fileSize: null,
          metadata: { migrated: true, originalSource: source }
        }));

        await prisma.noteSource.createMany({
          data: structuredSources,
          skipDuplicates: true
        });
      }
    }

    console.log(`✅ Migrated ${notes.length} notes with sources`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateNoteSources(); 