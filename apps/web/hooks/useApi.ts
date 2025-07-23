import { useMemo } from 'react';
import { useAuthStore } from '../store/auth';
import { apiService } from '../lib/api';

export function useApi() {
  const { jwtToken } = useAuthStore();

  const authenticatedApiService = useMemo(() => {
    // Create a wrapper around the API service that includes the current JWT token
    return {
      ...apiService,
      request: async <T>(endpoint: string, options: RequestInit = {}): Promise<any> => {
        const url = `${apiService['baseUrl']}${endpoint}`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(options.headers as Record<string, string> || {}),
        };

        // // Debug: Log the JWT token status
        // console.log('🔐 useApi - JWT Token available:', !!jwtToken);
        // console.log('🔐 useApi - JWT Token preview:', jwtToken ? jwtToken.substring(0, 20) + '...' : 'None');

        if (jwtToken) {
          headers.Authorization = `Bearer ${jwtToken}`;
          console.log('🔐 useApi - Authorization header set');
        } else {
          console.log('🔐 useApi - No JWT token available, request will fail');
        }

        try {
          const response = await fetch(url, {
            ...options,
            headers,
          });

          console.log('🔐 useApi - Response status:', response.status);

          if (response.status === 401) {
            console.log('🔐 useApi - 401 Unauthorized - JWT token may be invalid or missing');
            throw new Error('Authentication failed - please login again');
          }

          return await response.json();
        } catch (error) {
          console.error('🔐 useApi - API request failed:', error);
          throw error;
        }
      },
      // Override the methods that need authentication
      getMessages: async (filters?: { mentorId?: string; limit?: number; offset?: number }) => {
        const params = new URLSearchParams();
        if (filters?.mentorId) params.append('mentorId', filters.mentorId);
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.offset) params.append('offset', filters.offset.toString());

        return authenticatedApiService.request(`/mentor/messages?${params.toString()}`);
      },
      sendChatMessage: async (messageData: { prompt: string; model?: string; mentorId?: string }) => {
        return authenticatedApiService.request('/mentor/chat', {
          method: 'POST',
          body: JSON.stringify(messageData),
        });
      },
      getMentors: async () => {
        return authenticatedApiService.request('/mentor/mentors');
      },
      createMentor: async (mentorData: { name: string; role?: string; knowledges: string[]; about?: string }) => {
        return authenticatedApiService.request('/mentor/mentors', {
          method: 'POST',
          body: JSON.stringify(mentorData),
        });
      },
      updateMentor: async (id: string, updates: any) => {
        return authenticatedApiService.request(`/mentor/mentors/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
      },
      deleteMentor: async (id: string) => {
        return authenticatedApiService.request(`/mentor/mentors/${id}`, {
          method: 'DELETE',
        });
      },
      getFundingAccounts: async () => {
        return authenticatedApiService.request('/mentor/funding-accounts');
      },
      createFundingAccount: async (accountData: any) => {
        return authenticatedApiService.request('/mentor/funding-accounts', {
          method: 'POST',
          body: JSON.stringify(accountData),
        });
      },
      updateFundingAccount: async (id: string, updates: any) => {
        return authenticatedApiService.request(`/mentor/funding-accounts/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
      },
      deleteFundingAccount: async (id: string) => {
        return authenticatedApiService.request(`/mentor/funding-accounts/${id}`, {
          method: 'DELETE',
        });
      },
      getBadges: apiService.getBadges,
      awardBadge: apiService.awardBadge,
      // Keep other methods from the original apiService
      evmLogin: apiService.evmLogin,
      starknetLogin: apiService.starknetLogin,
      getProfile: apiService.getProfile,
      createTask: apiService.createTask,
      getTasks: apiService.getTasks,
      getTask: apiService.getTask,
      updateTask: apiService.updateTask,
      deleteTask: apiService.deleteTask,
      createGoal: apiService.createGoal,
      getGoals: apiService.getGoals,
      updateGoal: apiService.updateGoal,
      createTimerSession: apiService.createTimerSession,
      getTimerSessions: apiService.getTimerSessions,
      createTimerBreakSession: apiService.createTimerBreakSession,
      getSettings: apiService.getSettings,
      updateSettings: apiService.updateSettings,
      getTaskStats: apiService.getTaskStats,
      getFocusStats: apiService.getFocusStats,
      isAuthenticated: () => !!jwtToken,
      getAccessToken: () => jwtToken,
    };
  }, [jwtToken]);

  return authenticatedApiService;
} 