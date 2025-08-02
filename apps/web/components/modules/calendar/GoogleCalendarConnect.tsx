'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useUIStore } from '../../../store/uiStore';
import { ButtonPrimary } from '../../small/buttons';
import { Icon } from '../../small/icons';
import { isUserAuthenticated } from '../../../lib/auth';

export default function GoogleCalendarConnect() {
  const { showToast } = useUIStore();
  const [connecting, setConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [showOAuthHelp, setShowOAuthHelp] = useState(false);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    if (!isUserAuthenticated()) {
      setCheckingStatus(false);
      return;
    }

    try {
      const response = await api.getGoogleCalendarStatus();
      if (response.success) {
        setIsConnected(response.data?.isConnected || false);
      }
    } catch (error) {
      console.error('Failed to check connection status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

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

        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }

        // Listen for the callback
        const checkClosed = setInterval(async () => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            
            // Check if connection was successful
            await checkConnectionStatus();
            
            if (isConnected) {
              showToast({
                message: 'Google Calendar connected!',
                description: 'You can now sync your tasks and focus sessions',
                type: 'success',
                duration: 5000
              });
            } else {
              showToast({
                message: 'Connection failed',
                description: 'Please try connecting again',
                type: 'error',
                duration: 5000
              });
            }
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          if (!popup?.closed) {
            popup.close();
            clearInterval(checkClosed);
            showToast({
              message: 'Connection timeout',
              description: 'Please try again',
              type: 'error',
              duration: 5000
            });
          }
        }, 300000); // 5 minutes
      } else {
        throw new Error('Failed to get authorization URL');
      }
    } catch (error) {
      console.error('Failed to connect Google Calendar:', error);
      
      // Check if it's the OAuth testing mode error
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('access_denied') || errorMessage.includes('validation')) {
        setShowOAuthHelp(true);
        showToast({
          message: 'OAuth App in Testing Mode',
          description: 'Please add your email as a test user in Google Cloud Console',
          type: 'error',
          duration: 8000
        });
      } else {
        showToast({
          message: 'Failed to connect Google Calendar',
          description: error instanceof Error ? error.message : 'Please try again later',
          type: 'error',
          duration: 5000
        });
      }
    } finally {
      setConnecting(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      const response = await api.disconnectGoogleCalendar();
      if (response.success) {
        setIsConnected(false);
        showToast({
          message: 'Google Calendar disconnected',
          description: 'Calendar integration has been removed',
          type: 'success',
          duration: 3000
        });
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Failed to disconnect Google Calendar:', error);
      showToast({
        message: 'Failed to disconnect',
        description: 'Please try again later',
        type: 'error',
        duration: 5000
      });
    }
  };

  if (checkingStatus) {
    return (
      <div className="p-4 border rounded-lg">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Checking connection status...</span>
        </div>
      </div>
    );
  }

  if (!isUserAuthenticated()) {
    return (
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-medium mb-2">Connect Google Calendar</h3>
        <p className="text-sm text-gray-600 mb-4">
          Please login to connect your Google Calendar
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-medium mb-2">Google Calendar Integration</h3>
      <p className="text-sm text-gray-600 mb-4">
        {isConnected 
          ? 'Your Google Calendar is connected. You can sync tasks, goals, and focus sessions.'
          : 'Connect your Google Calendar to sync tasks, goals, and focus sessions automatically.'
        }
      </p>
      
      {isConnected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-600">
            <Icon name="check" />
            <span className="text-sm font-medium">Connected</span>
          </div>
          <div className="flex gap-2">
            <ButtonPrimary
              onClick={disconnectGoogleCalendar}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
            >
              <Icon name="close" />
              Disconnect
            </ButtonPrimary>
          </div>
        </div>
      ) : (
        <ButtonPrimary
          onClick={connectGoogleCalendar}
          disabled={connecting}
          className="flex items-center gap-2"
        >
          <Icon name="calendar" />
          {connecting ? 'Connecting...' : 'Connect Google Calendar'}
        </ButtonPrimary>
      )}
      
      {!isConnected && (
        <div className="mt-4 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">What you can do:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Sync tasks with due dates to your calendar</li>
            <li>• Block focus time automatically</li>
            <li>• Import calendar events as tasks</li>
            <li>• Get availability insights</li>
          </ul>
        </div>
      )}

      {/* OAuth Testing Mode Help */}
      {showOAuthHelp && process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">
            🔧 OAuth App Setup Required
          </h4>
          <p className="text-xs text-yellow-700 mb-3">
            Your Google OAuth app is in testing mode. To connect your calendar:
          </p>
          <ol className="text-xs text-yellow-700 space-y-1 mb-3">
            <li>1. Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
            <li>2. Select your project</li>
            <li>3. Go to "APIs & Services" → "OAuth consent screen"</li>
            <li>4. Scroll to "Test users" section</li>
            <li>5. Click "Add Users" and add your email address</li>
            <li>6. Save and try connecting again</li>
          </ol>
          <div className="flex gap-2">
            <button
              onClick={() => setShowOAuthHelp(false)}
              className="text-xs text-yellow-600 hover:text-yellow-800"
            >
              Got it
            </button>
            <button
              onClick={() => {
                setShowOAuthHelp(false);
                connectGoogleCalendar();
              }}
              className="text-xs text-yellow-600 hover:text-yellow-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 