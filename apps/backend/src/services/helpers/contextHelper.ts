import { MemoryContext } from '../../services/memory/memoryManager';

export function buildContextString(memory: MemoryContext | null | undefined, sources?: string[]): string {
  if (!memory) return '';
  let context = 'Context: You are an AI mentor helping with productivity and focus.';
  const src = sources || memory.metadata.dataSources;

  if (src.includes('tasks') && memory.userContext.tasks.length > 0) {
    context += `\n\nCurrent Tasks:\n${memory.userContext.tasks.map((t: any) =>
      `- ${t.title}${t.description ? `: ${t.description}` : ''} (${t.priority} priority, ${t.completed ? 'completed' : 'pending'})`
    ).join('\n')}`;
  }
  if (src.includes('goals') && memory.userContext.goals.length > 0) {
    context += `\n\nCurrent Goals:\n${memory.userContext.goals.map((g: any) =>
      `- ${g.title}${g.description ? `: ${g.description}` : ''} (${g.progress}% complete)`
    ).join('\n')}`;
  }
  if (src.includes('sessions') && memory.userContext.timerSessions.length > 0) {
    const recentSessions = memory.userContext.timerSessions.slice(0, 3);
    context += `\n\nRecent Focus Sessions:\n${recentSessions.map((s: any) =>
      `- ${s.type} session: ${Math.round(s.duration / 60)} minutes on ${new Date(s.startTime).toLocaleDateString()}`
    ).join('\n')}`;
  }
  if (src.includes('mentor') && memory.userContext.mentorProfile) {
    const mentor = memory.userContext.mentorProfile;
    context += `\n\nMentor Context:\n- Name: ${mentor.name}\n- Role: ${mentor.role}\n- Knowledge: ${mentor.knowledges?.join(', ')}`;
  }
  if (src.includes('badges') && memory.userContext.badges && memory.userContext.badges.length > 0) {
    context += `\n\nRecent Badges:\n${memory.userContext.badges.map((b: any) =>
      `- ${b.name}: ${b.description}`
    ).join('\n')}`;
  }
  if (src.includes('quests') && memory.userContext.quests && memory.userContext.quests.length > 0) {
    context += `\n\nActive Quests:\n${memory.userContext.quests.map((q: any) =>
      `- ${q.name}: ${q.description}`
    ).join('\n')}`;
  }
  if (src.includes('settings') && memory.userContext.settings) {
    context += `\n\nUser Settings:\n- Theme: ${memory.userContext.settings.theme}\n- Notifications: ${memory.userContext.settings.notifications}`;
  }
  if (memory.messages.length > 0) {
    const historyMessages = memory.messages.slice(-10);
    const conversationHistory = historyMessages.map(m =>
      `${m.role}: ${m.content}`
    ).join('\n');
    context += `\n\nRecent Conversation History:\n${conversationHistory}`;
  }
  return context;
} 