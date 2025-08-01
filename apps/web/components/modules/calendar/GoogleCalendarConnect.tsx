'use client';

import { useState } from 'react';
import { api } from '../../../lib/api';
import { useUIStore } from '../../../store/uiStore';
import { ButtonPrimary } from '../../small/buttons';
import { Icon } from '../../small/icons';

export default function GoogleCalendarConnect() {
  const { showToast } = useUIStore();
  const [connecting, setConnecting] = useState(false);

  const connectGoogleCalendar = async () => {
    try {
      setConnecting(true);
      
      // Get the authorization URL
      const response = await api.getGoogleCalendarAuthUrl();
      
      if (response.success && response.data?.authUrl) {
        // Open Google OAuth in a popup
        const popup = window.open(
          response.data.authUrl,
          'google-calendar-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for the callback
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            showToast({
              message: 'Google Calendar connected!',
              description: 'You can now sync your tasks and focus sessions',
              type: 'success',
              duration: 5000
            });
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to connect Google Calendar:', error);
      showToast({
        message: 'Failed to connect Google Calendar',
        description: 'Please try again later',
        type: 'error',
        duration: 5000
      });
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-medium mb-2">Connect Google Calendar</h3>
      <p className="text-sm text-gray-600 mb-4">
        Sync your tasks, goals, and focus sessions with Google Calendar
      </p>
      <ButtonPrimary
        onClick={connectGoogleCalendar}
        disabled={connecting}
        className="flex items-center gap-2"
      >
        <Icon name="calendar" />
        {connecting ? 'Connecting...' : 'Connect Google Calendar'}
      </ButtonPrimary>
    </div>
  );
} 