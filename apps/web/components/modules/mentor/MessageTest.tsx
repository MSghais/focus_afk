'use client';

import { useState, useEffect } from 'react';
import { Message } from '../../../lib/api';
import { useUIStore } from '../../../store/uiStore';
import { useApi } from '../../../hooks/useApi';

export default function MessageTest() {
  const { showToast } = useUIStore();
  const apiService = useApi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getMessages({ limit: 10 });
      
      if (response.success && response.data) {
        setMessages(response.data);
        showToast({
          message: `Loaded ${response.data.length} messages`,
          type: 'success',
        });
      } else {
        showToast({
          message: 'Failed to load messages',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      showToast({
        message: 'Error loading messages',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestMessage = async () => {
    try {
      const response = await apiService.sendChatMessage({
        prompt: 'Hello! This is a test message from the frontend.',
      });

      if (response.success) {
        showToast({
          message: 'Test message sent successfully!',
          type: 'success',
        });
        // Reload messages
        await loadMessages();
      } else {
        showToast({
          message: 'Failed to send test message',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      showToast({
        message: 'Error sending test message',
        type: 'error',
      });
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">Message Endpoint Test</h2>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={loadMessages}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load Messages'}
          </button>
          
          <button
            onClick={sendTestMessage}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Send Test Message
          </button>
        </div>

        <div className="border rounded p-4 max-h-64 overflow-y-auto">
          <h3 className="font-semibold mb-2">Messages ({messages.length})</h3>
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages found</p>
          ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                <div key={message.id} className="border-b pb-2">
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-1 rounded text-xs ${
                      message.role === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {message.role}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{message.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 