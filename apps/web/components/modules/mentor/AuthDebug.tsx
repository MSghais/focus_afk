'use client';

import { useAuthStore } from '../../../store/auth';
import { useApi } from '../../../hooks/useApi';
import { isUserAuthenticated, getJwtToken } from '../../../lib/auth';
// import { useStarknetLogin } from '../../../hooks/useStarknetLogin';
// import { useEvmLogin } from '../../../hooks/useEvmLogin';
// import { useStarknetLogin } from '../../../hooks/useStarknetLogin';

export default function AuthDebug() {
  const { jwtToken, userConnected, isAuthenticated } = useAuthStore();
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

  const checkLocalStorage = () => {
    if (typeof window === 'undefined') {
      return {
        token: 'SSR - No localStorage',
        user: 'SSR - No localStorage',
        isAuthenticated: 'SSR - No localStorage',
      };
    }
    
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const isAuth = localStorage.getItem('isAuthenticated');
    
    return {
      token: token ? '✅ Available' : '❌ Not available',
      user: user ? '✅ Available' : '❌ Not available',
      isAuthenticated: isAuth === 'true' ? '✅ True' : '❌ False',
    };
  };

  const checkZustandStore = () => {
    const authState = useAuthStore.getState();
    return {
      jwtToken: authState.jwtToken ? '✅ Available' : '❌ Not available',
      token: authState.token ? '✅ Available' : '❌ Not available',
      userConnected: authState.userConnected ? '✅ Available' : '❌ Not available',
      isAuthenticated: authState.isAuthenticated ? '✅ True' : '❌ False',
      evmAddress: authState.evmAddress ? '✅ Available' : '❌ Not available',
      starknetAddress: authState.starknetAddress ? '✅ Available' : '❌ Not available',
      loginType: authState.loginType ? `✅ ${authState.loginType}` : '❌ Not available',
    };
  };

  const localStorageStatus = checkLocalStorage();
  const zustandStatus = checkZustandStore();

  return (
    <div className="p-4 bg-yellow-100 rounded-lg border">
      <h3 className="font-bold mb-2">Auth Debug Info</h3>
      
      <div className="space-y-4">
        {/* Zustand Store Status */}
        <div>
          <h4 className="font-semibold text-blue-800 mb-2">Zustand Store Status:</h4>
          <div className="space-y-1 text-sm">
            <div>
              <strong>jwtToken:</strong> 
              <span className={zustandStatus.jwtToken.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                {zustandStatus.jwtToken}
              </span>
            </div>
            <div>
              <strong>token:</strong> 
              <span className={zustandStatus.token.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                {zustandStatus.token}
              </span>
            </div>
            <div>
              <strong>userConnected:</strong> 
              <span className={zustandStatus.userConnected.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                {zustandStatus.userConnected}
              </span>
            </div>
            <div>
              <strong>isAuthenticated:</strong> 
              <span className={zustandStatus.isAuthenticated.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                {zustandStatus.isAuthenticated}
              </span>
            </div>
            <div>
              <strong>evmAddress:</strong> 
              <span className={zustandStatus.evmAddress.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                {zustandStatus.evmAddress}
              </span>
            </div>
            <div>
              <strong>starknetAddress:</strong> 
              <span className={zustandStatus.starknetAddress.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                {zustandStatus.starknetAddress}
              </span>
            </div>
            <div>
              <strong>loginType:</strong> 
              <span className={zustandStatus.loginType.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                {zustandStatus.loginType}
              </span>
            </div>
          </div>
        </div>

        {/* localStorage Status */}
        <div>
          <h4 className="font-semibold text-purple-800 mb-2">localStorage Status:</h4>
          <div className="space-y-1 text-sm">
            <div>
              <strong>token:</strong> 
              <span className={localStorageStatus.token.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                {localStorageStatus.token}
              </span>
            </div>
            <div>
              <strong>user:</strong> 
              <span className={localStorageStatus.user.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                {localStorageStatus.user}
              </span>
            </div>
            <div>
              <strong>isAuthenticated:</strong> 
              <span className={localStorageStatus.isAuthenticated.includes('✅') ? 'text-green-600' : 'text-red-600'}>
                {localStorageStatus.isAuthenticated}
              </span>
            </div>
          </div>
        </div>

        {/* Auth Utility Functions */}
        <div>
          <h4 className="font-semibold text-green-800 mb-2">Auth Utility Functions:</h4>
          <div className="space-y-1 text-sm">
            <div>
              <strong>isUserAuthenticated():</strong> 
              <span className={isUserAuthenticated() ? 'text-green-600' : 'text-red-600'}>
                {isUserAuthenticated() ? '✅ True' : '❌ False'}
              </span>
            </div>
            <div>
              <strong>getJwtToken():</strong> 
              <span className={getJwtToken() ? 'text-green-600' : 'text-red-600'}>
                {getJwtToken() ? '✅ Available' : '❌ Not available'}
              </span>
            </div>
          </div>
        </div>

        {/* Token Preview */}
        {jwtToken && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Token Preview:</h4>
            <code className="text-xs bg-gray-200 p-2 rounded block">
              {jwtToken.substring(0, 50)}...
            </code>
          </div>
        )}
        
        {/* User Info */}
        {userConnected && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">User Info:</h4>
            <div className="text-sm space-y-1">
              <div><strong>Address:</strong> {userConnected.userAddress}</div>
              <div><strong>ID:</strong> {userConnected.id}</div>
              <div><strong>Login Type:</strong> {userConnected.loginType}</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 space-x-2">
        <button
          onClick={testAuth}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Test Auth API
        </button>
        
        <button
          onClick={() => {
            const authStore = useAuthStore.getState();
            console.log('Auth Store State:', authStore);
            alert('Auth store state logged to console');
          }}
          className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
        >
          Log Store State
        </button>
        
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              const token = localStorage.getItem('token');
              const user = localStorage.getItem('user');
              const isAuth = localStorage.getItem('isAuthenticated');
              const evmAddress = localStorage.getItem('evmAddress');
              const starknetAddress = localStorage.getItem('starknetAddress');
              const loginType = localStorage.getItem('loginType');
              
              const localStorageData = {
                token: !!token,
                user: !!user,
                isAuthenticated: isAuth,
                evmAddress: !!evmAddress,
                starknetAddress: !!starknetAddress,
                loginType: loginType,
              };
              
              console.log('localStorage State:', localStorageData);
              alert(`localStorage: ${JSON.stringify(localStorageData, null, 2)}`);
            }
          }}
          className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
        >
          Check localStorage
        </button>
        
        <button
          onClick={() => {
            const { initializeAuth } = useAuthStore.getState();
            initializeAuth();
            alert('Auth initialization triggered');
          }}
          className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
        >
          Re-init Auth
        </button>
        
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              const token = localStorage.getItem('token');
              const userStr = localStorage.getItem('user');
              const isAuth = localStorage.getItem('isAuthenticated') === 'true';
              
              if (token && userStr && isAuth) {
                try {
                  const user = JSON.parse(userStr);
                  useAuthStore.setState({
                    userConnected: user,
                    token,
                    jwtToken: token,
                    isAuthenticated: true,
                  });
                  alert('✅ Zustand store synced from localStorage');
                } catch (error) {
                  alert(`❌ Error syncing: ${error}`);
                }
              } else {
                alert('❌ Missing data in localStorage for sync');
              }
            }
          }}
          className="px-3 py-1 bg-teal-500 text-white rounded text-sm hover:bg-teal-600"
        >
          Sync Store from localStorage
        </button>
        
        <button
          onClick={async () => {
            try {
              console.log('🔐 Testing API call...');
              const response = await apiService.getProfile();
              console.log('🔐 API call result:', response);
              alert(`API call: ${response.success ? 'SUCCESS' : 'FAILED'}`);
            } catch (error) {
              console.error('🔐 API call error:', error);
              alert(`API call ERROR: ${error}`);
            }
          }}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          Test API Call
        </button>
        
        <button
          onClick={() => {
            // Compare Zustand store vs localStorage
            const authState = useAuthStore.getState();
            const localStorageToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const localStorageUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
            const localStorageIsAuth = typeof window !== 'undefined' ? localStorage.getItem('isAuthenticated') === 'true' : false;
            
            const comparison = {
              jwtToken: {
                zustand: !!authState.jwtToken,
                localStorage: !!localStorageToken,
                match: authState.jwtToken === localStorageToken
              },
              user: {
                zustand: !!authState.userConnected,
                localStorage: !!localStorageUser,
                match: authState.userConnected && localStorageUser ? 
                  authState.userConnected.id === JSON.parse(localStorageUser).id : false
              },
              isAuthenticated: {
                zustand: authState.isAuthenticated,
                localStorage: localStorageIsAuth,
                match: authState.isAuthenticated === localStorageIsAuth
              }
            };
            
            console.log('🔐 Store vs localStorage Comparison:', comparison);
            alert(`Comparison:\n${JSON.stringify(comparison, null, 2)}`);
          }}
          className="px-3 py-1 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600"
        >
          Compare Stores
        </button>
      </div>
    </div>
  );
} 