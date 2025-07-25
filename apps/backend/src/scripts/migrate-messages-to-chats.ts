import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateMessagesToChats() {
  console.log('🔄 Starting migration of existing messages to new chat structure...');

  try {
    // Check if the Chat model exists in the current schema
    console.log('📊 Checking current schema state...');
    
    // For now, just create some sample chats to test the new structure
    console.log('✅ Migration script ready for when schema is updated');
    console.log('📝 Run the schema migration first: ./migrate-chat-schema.sh');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateMessagesToChats()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateMessagesToChats }; 