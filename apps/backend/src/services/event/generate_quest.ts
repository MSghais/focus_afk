import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { AiService } from '../../ai/ai';
import { DEFAULT_MODEL } from '../../config/models';

const prisma = new PrismaClient();
const aiService = new AiService();

function isToday(date) {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}


export const generateDailyQuest = async (socket: Socket) => {
  try {
    const userId = socket.data.user?.id;
    if (!userId) return;

      // Check if a quest was already generated today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const existingQuest = await prisma.quests.findFirst({
        where: {
          userId,
          dateAwarded: { gte: today },
        },
      });

      console.log('Existing quest:', existingQuest);
      if (existingQuest) {
        socket.emit('quest_of_the_day', existingQuest);
        return;
      }

      // Fetch today's tasks, goals, and recent messages
      const tasks = await prisma.task.findMany({
        where: {
          userId,
          OR: [
            { dueDate: { gte: today } },
            { createdAt: { gte: today } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });


      console.log('Tasks:', tasks);

      // Fetch today's goals
      const goals = await prisma.goal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      console.log('Goals:', goals);

      // Get messages from chats (new structure)
      // TODO: Uncomment after schema migration
      // const chats = await prisma.chat.findMany({
      //   where: { userId },
      //   include: {
      //     messages: {
      //       orderBy: { createdAt: 'desc' },
      //       take: 5, // Get last 5 messages from each chat
      //     },
      //   },
      //   take: 5, // Get last 5 chats
      // });

      // Flatten messages from all chats
      // const messages = chats.flatMap(chat => chat.messages).slice(0, 20);
      
      // Get messages from chats (new structure)
      const chats = await prisma.chat.findMany({
        where: { userId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 5, // Get last 5 messages from each chat
          },
        },
        take: 5, // Get last 5 chats
      });

      // Flatten messages from all chats
      const messages = chats.flatMap(chat => chat.messages).slice(0, 20);

      console.log('Messages:', messages);

      // Compose prompt for AI
      const prompt = `Generate a motivating, actionable quest for today for the user based on the following:
        Tasks:
        ${tasks.map(t => `- ${t.title}: ${t.description || ''}`).join('\n')}

        Goals:
        ${goals.map(g => `- ${g.title}: ${g.description || ''}`).join('\n')}

        Recent messages:
        ${messages.map(m => `- ${m.content}`).join('\n')}

        The quest should be specific, achievable today, and help the user make progress on their goals and tasks. Format as a short title and a 1-2 sentence description.`;

      // Call AI to generate quest
      const aiResult = await aiService.generateTextLlm({
        model: DEFAULT_MODEL,
        prompt,
        systemPrompt: 'You are a productivity mentor creating daily quests for users.'
      });
      const questText = aiResult?.text || 'Complete a meaningful task today!';
      const [title, ...descArr] = questText.split('\n');
      const name = title?.trim() || 'Daily Quest';
      const description = descArr.join(' ').trim() || questText;

      // Save quest to DB
      const quest = await prisma.quests.create({
        data: {
          userId,
          name,
          description,
          type: 'daily',
          dateAwarded: new Date(),
        },
      });

      // Emit quest to user
      socket.emit('quest_of_the_day', quest);
  } catch (err) {
    // ignore
  }
}