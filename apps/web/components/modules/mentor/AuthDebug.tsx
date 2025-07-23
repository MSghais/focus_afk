'use client';

import { useAuthStore } from '../../../store/auth';
import { useApi } from '../../../hooks/useApi';

export default function AuthDebug() {
  const { jwtToken, userConnected } = useAuthStore();
  const apiService = useApi();

  const testAuth = async () => {
    try {
      const response = await apiService.getProfile();
      console.log('Profile response:', response);
      alert(`Auth test: ${response.success ? 'SUCCESS' : 'FAILED'}\n${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      console.error('Auth test error:', error);
      alert(`Auth test ERROR: ${error}`);
    }
  };

  return (
    <div className="p-4 bg-yellow-100 rounded-lg border">
      <h3 className="font-bold mb-2">Auth Debug Info</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>JWT Token:</strong> 
          <span className={jwtToken ? 'text-green-600' : 'text-red-600'}>
            {jwtToken ? '✅ Available' : '❌ Not available'}
          </span>
        </div>
        
        <div>
          <strong>User Connected:</strong> 
          <span className={userConnected ? 'text-green-600' : 'text-red-600'}>
            {userConnected ? '✅ Yes' : '❌ No'}
          </span>
        </div>
        
        {jwtToken && (
          <div>
            <strong>Token Preview:</strong> 
            <code className="text-xs bg-gray-200 p-1 rounded">
              {jwtToken.substring(0, 20)}...
            </code>
          </div>
        )}
        
        {userConnected && (
          <div>
            <strong>User Address:</strong> 
            <code className="text-xs bg-gray-200 p-1 rounded">
              {userConnected.userAddress}
            </code>
          </div>
        )}
      </div>
      
      <button
        onClick={testAuth}
        className="mt-3 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
      >
        Test Auth API
      </button>
    </div>
  );
} 