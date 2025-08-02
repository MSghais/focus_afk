'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '../../../../lib/api';
import { useUIStore } from '../../../../store/uiStore';

export default function GoogleCallbackPage() {
  const searchParams = useSearchParams();
  const { showToast } = useUIStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Google Calendar connection...');
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple executions
      if (hasProcessed) {
        return;
      }
      setHasProcessed(true);
      try {
        // Get the authorization code from URL parameters
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        console.log('🔍 OAuth Callback Debug:');
        console.log('  - Code:', code ? `${code.substring(0, 20)}...` : 'null');
        console.log('  - Error:', error);
        console.log('  - URL params:', Object.fromEntries(searchParams.entries()));

        if (error) {
          console.error('Google OAuth error:', error);
          setStatus('error');
          setMessage(`Authorization failed: ${error}`);
          
          showToast({
            message: 'Google Calendar connection failed',
            description: `Error: ${error}`,
            type: 'error',
            duration: 5000
          });
          
          // Close the popup after a delay
          setTimeout(() => {
            if (window.opener) {
              window.close();
            }
          }, 3000);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received from Google');
          
          showToast({
            message: 'Google Calendar connection failed',
            description: 'No authorization code received',
            type: 'error',
            duration: 5000
          });
          
          setTimeout(() => {
            if (window.opener) {
              window.close();
            }
          }, 3000);
          return;
        }

        // Check if code looks valid (should start with "4/")
        if (!code.startsWith('4/')) {
          setStatus('error');
          setMessage('Invalid authorization code format');
          
          showToast({
            message: 'Google Calendar connection failed',
            description: 'Invalid authorization code format',
            type: 'error',
            duration: 5000
          });
          
          setTimeout(() => {
            if (window.opener) {
              window.close();
            }
          }, 3000);
          return;
        }

        // Send the code to our backend
        const response = await api.handleGoogleCalendarCallback(code);
        
        console.log('response', response);
        if (response.success) {
          setStatus('success');
          setMessage('Google Calendar connected successfully!');
          
          showToast({
            message: 'Google Calendar connected!',
            description: 'You can now sync your tasks and focus sessions',
            type: 'success',
            duration: 5000
          });
          
          // Notify the parent window that connection was successful
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_CALENDAR_CONNECTED' }, '*');
          }

          localStorage?.setItem('isGoogleCalendarConnected', 'true');
          
          // Close the popup after a delay
          setTimeout(() => {
            if (window.opener) {
              window.close();
            }
          }, 2000);
        } else {
          console.log('response.error', response.error);
          throw new Error(response.error || 'Failed to connect Google Calendar');
        }
      } catch (error) {
        console.error('Error handling Google callback:', error);
        setStatus('error');
        setMessage(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        showToast({
          message: 'Google Calendar connection failed',
          description: error instanceof Error ? error.message : 'Please try again',
          type: 'error',
          duration: 5000
        });
        
        setTimeout(() => {
          if (window.opener) {
            window.close();
          }
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, showToast]);

  return (
    <div className="min-h-screen flex items-center justify-center ">
      <div className="max-w-md w-full rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          {status === 'loading' && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          )}
          {status === 'success' && (
            <div className="text-green-500 text-4xl mb-4">✓</div>
          )}
          {status === 'error' && (
            <div className="text-red-500 text-4xl mb-4">✗</div>
          )}
        </div>
        
        <h2 className="text-xl font-semibold mb-4">
          {status === 'loading' && 'Connecting Google Calendar...'}
          {status === 'success' && 'Connection Successful!'}
          {status === 'error' && 'Connection Failed'}
        </h2>
        
        <p className="text-gray-600 mb-6">{message}</p>
        
        {status === 'loading' && (
          <div className="text-sm text-gray-500">
            Please wait while we complete the connection...
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-sm text-green-600">
            This window will close automatically.
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-sm text-red-600">
            This window will close automatically.
          </div>
        )}
      </div>
    </div>
  );
} 