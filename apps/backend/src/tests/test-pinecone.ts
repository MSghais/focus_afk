import { PrismaClient } from '@prisma/client';
import { PineconeService } from '../ai/memory/pinecone.service';
import { EnhancedContextManager } from '../ai/memory/enhancedContextManager';
import { MemoryManager } from '../ai/memory/memoryManager';

async function testPineconeIntegration() {
  console.log('🧪 Testing Pinecone Integration...\n');

  try {
    // Initialize services
    const prisma = new PrismaClient();
    const pineconeService = new PineconeService(prisma);
    const memoryManager = new MemoryManager(prisma);
    const enhancedContextManager = new EnhancedContextManager(prisma, pineconeService, memoryManager);

    // Test 1: Check if Pinecone is accessible
    console.log('1. Testing Pinecone connectivity...');
    try {
      const stats = await enhancedContextManager.getContextStats('test-user-id');
      console.log('✅ Pinecone is accessible');
      console.log('   Context stats:', stats);
    } catch (error) {
      console.log('❌ Pinecone connection failed:', error.message);
    }

    // Test 2: Test vector search
    console.log('\n2. Testing vector search...');
    try {
      const searchResults = await enhancedContextManager.searchUserContent(
        'test-user-id',
        'productivity focus tasks',
        ['tasks', 'goals'],
        5
      );
      console.log('✅ Vector search working');
      console.log('   Found', searchResults.length, 'results');
    } catch (error) {
      console.log('❌ Vector search failed:', error.message);
    }

    // Test 3: Test quest generation use case
    console.log('\n3. Testing quest generation use case...');
    try {
      const useCase = enhancedContextManager.getUseCase('quest_generation');
      if (useCase) {
        console.log('✅ Quest generation use case found');
        console.log('   Use case:', useCase.name);
        console.log('   Vector search enabled:', useCase.vectorSearchEnabled);
      } else {
        console.log('❌ Quest generation use case not found');
      }
    } catch (error) {
      console.log('❌ Use case test failed:', error.message);
    }

    // Test 4: Test enhanced context generation
    console.log('\n4. Testing enhanced context generation...');
    try {
      const enhancedContext = await enhancedContextManager.generateEnhancedContext({
        userId: 'test-user-id',
        // userAddress: '0x123456789',
        useCase: 'quest_generation',
        userMessage: 'Generate personalized quests for a user with focus on productivity'
      });
      console.log('✅ Enhanced context generation working');
      console.log('   Vector results count:', enhancedContext.metadata.vectorResultsCount);
      console.log('   Context sources:', enhancedContext.metadata.contextSources);
    } catch (error) {
      console.log('❌ Enhanced context generation failed:', error.message);
    }

    console.log('\n🎉 Pinecone Integration Test Complete!');
    
    // Close connections
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testPineconeIntegration(); 