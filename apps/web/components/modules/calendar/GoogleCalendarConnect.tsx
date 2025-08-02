'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useUIStore } from '../../../store/uiStore';
import { ButtonPrimary } from '../../small/buttons';
import { Icon } from '../../small/icons';
import { isUserAuthenticated } from '../../../lib/auth';
import { useAuthStore } from '../../../store/auth';

interface ConnectionStatus {
  isConnected: boolean;
  lastSync?: string;
  expiresAt?: string;
  needsRefresh?: boolean;
}

export default function GoogleCalendarConnect() {
  const { showToast } = useUIStore();
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ isConnected: false });
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [showOAuthHelp, setShowOAuthHelp] = useState(false);

  const { isGoogleCalendarConnected ,setIsGoogleCalendarConnected} = useAuthStore();
  useEffect(() => {
    checkConnectionStatus();

    // Listen for messages from the OAuth callback page
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_CALENDAR_CONNECTED') {
        checkConnectionStatus();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkConnectionStatus = async () => {
    if (!isUserAuthenticated()) {
      setCheckingStatus(false);
      return;
    }

    try {
      const response = await api.getGoogleCalendarStatus();
      if (response.success && response.data) {
        setConnectionStatus(response.data);
        setIsGoogleCalendarConnected(response.data.isConnected);
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
            
            if (connectionStatus.isConnected) {
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

  const refreshToken = async () => {
    try {
      setRefreshing(true);
      const response = await api.refreshGoogleCalendarToken();
      
      if (response.success) {
        await checkConnectionStatus();
        showToast({
          message: 'Token refreshed',
          description: 'Your access token has been refreshed successfully',
          type: 'success',
          duration: 3000
        });
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      showToast({
        message: 'Failed to refresh token',
        description: 'Please try reconnecting your Google Calendar',
        type: 'error',
        duration: 5000
      });
    } finally {
      setRefreshing(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      const response = await api.disconnectGoogleCalendar();
      if (response.success) {
        setConnectionStatus({ isConnected: false });
        showToast({
          message: 'Google Calendar disconnected',
          description: 'Calendar integration has been removed securely',
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (checkingStatus) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Checking connection status...</p>
        </div>
      </div>
    );
  }

  if (!isUserAuthenticated()) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Please login to connect Google Calendar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col p-2 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Google Calendar Integration</h1>
        <p className="text-sm text-gray-500">
          {connectionStatus.isConnected 
            ? 'Your Google Calendar is connected. You can sync tasks, goals, and focus sessions.'
            : 'Connect your Google Calendar to sync tasks, goals, and focus sessions automatically.'
          }
        </p>
      </div>
      
      {connectionStatus.isConnected ? (
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="p-4 border  rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="check" />
              <span className="font-medium text-green-800">Connected</span>
            </div>
            
            <div className="space-y-2 text-sm text-green-700">
              {connectionStatus.lastSync && (
                <div>Last sync: {formatDate(connectionStatus.lastSync)}</div>
              )}
              {connectionStatus.expiresAt && (
                <div>Token expires: {formatDate(connectionStatus.expiresAt)}</div>
              )}
              {connectionStatus.needsRefresh && (
                <div className="text-orange-600 font-medium">⚠️ Token needs refresh</div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {connectionStatus.needsRefresh && (
              <ButtonPrimary
                onClick={refreshToken}
                disabled={refreshing}
                className="flex items-center gap-2  hover:bg-orange-700"
              >
                <Icon name="refresh" />
                {refreshing ? 'Refreshing...' : 'Refresh Token'}
              </ButtonPrimary>
            )}
            
            <ButtonPrimary
              onClick={disconnectGoogleCalendar}
              className="flex items-center gap-2  hover:bg-red-700"
            >
              <Icon name="close" />
              Disconnect
            </ButtonPrimary>
          </div>

          {/* Security Info */}
          <div className="p-4 border border-blue-200 rounded-lg">
            <h3 className="font-medium  mb-2">🔒 Security Information</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Your access tokens are encrypted before storage</li>
              <li>• Tokens are automatically refreshed when needed</li>
              <li>• You can revoke access at any time</li>
              <li>• No calendar data is stored locally</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <ButtonPrimary
            onClick={connectGoogleCalendar}
            disabled={connecting}
            className="flex items-center gap-2"
          >
            <Icon name="calendar" />
            {connecting ? 'Connecting...' : 'Connect Google Calendar'}
          </ButtonPrimary>
          
          <div className="p-4 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">What you can do:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Sync tasks with due dates to your calendar</li>
              <li>• Block focus time automatically</li>
              <li>• Import calendar events as tasks</li>
              <li>• Get availability insights</li>
            </ul>
          </div>
        </div>
      )}

      {/* OAuth Testing Mode Help */}
      {showOAuthHelp && process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-4  border border-yellow-200 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">
            🔧 OAuth App Setup Required
          </h4>
          <p className="text-xs mb-3">
            Your Google OAuth app is in testing mode. To connect your calendar:
          </p>
          <ol className="text-xs pace-y-1 mb-3">
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