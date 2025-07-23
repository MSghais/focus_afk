import { useAuthStore } from '../store/auth';

// Auth persistence keys
const AUTH_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  EVM_ADDRESS: 'evmAddress',
  STARKNET_ADDRESS: 'starknetAddress',
  LOGIN_TYPE: 'loginType',
  IS_AUTHENTICATED: 'isAuthenticated',
} as const;

  // Initialize auth state from localStorage
  export const initializeAuthFromStorage = () => {
    if (typeof window === 'undefined') return;

    try {
      const token = localStorage.getItem(AUTH_KEYS.TOKEN);
      const userStr = localStorage.getItem(AUTH_KEYS.USER);
      const evmAddress = localStorage.getItem(AUTH_KEYS.EVM_ADDRESS);
      const starknetAddress = localStorage.getItem(AUTH_KEYS.STARKNET_ADDRESS);
      const loginType = localStorage.getItem(AUTH_KEYS.LOGIN_TYPE) as "ethereum" | "starknet" | undefined;
      const isAuthenticated = localStorage.getItem(AUTH_KEYS.IS_AUTHENTICATED) === 'true';

      console.log('🔐 Auth Init - Checking localStorage for auth data...');

      if (token && userStr && isAuthenticated) {
        const user = JSON.parse(userStr);
        
        // Restore auth state
        useAuthStore.setState({
          userConnected: user,
          token,
          jwtToken: token,
          evmAddress: evmAddress || undefined,
          starknetAddress: starknetAddress || undefined,
          loginType,
          isAuthenticated: true,
        });

        console.log('🔐 Auth state restored from localStorage');
        return true;
      } else {
        console.log('🔐 Auth Init - Missing required data for restoration');
      }
    } catch (error) {
      console.error('Failed to restore auth state from localStorage:', error);
      // Clear corrupted localStorage data
      clearAuthFromStorage();
    }

    return false;
  };

// Save auth state to localStorage
export const saveAuthToStorage = (authData: {
  token: string;
  user: any;
  evmAddress?: string;
  starknetAddress?: string;
  loginType?: "ethereum" | "starknet";
}) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(AUTH_KEYS.TOKEN, authData.token);
    localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(authData.user));
    if (authData.evmAddress) localStorage.setItem(AUTH_KEYS.EVM_ADDRESS, authData.evmAddress);
    if (authData.starknetAddress) localStorage.setItem(AUTH_KEYS.STARKNET_ADDRESS, authData.starknetAddress);
    if (authData.loginType) localStorage.setItem(AUTH_KEYS.LOGIN_TYPE, authData.loginType);
    localStorage.setItem(AUTH_KEYS.IS_AUTHENTICATED, 'true');
    
    console.log('🔐 Auth state saved to localStorage');
  } catch (error) {
    console.error('Failed to save auth state to localStorage:', error);
  }
};

// Clear auth state from localStorage
export const clearAuthFromStorage = () => {
  if (typeof window === 'undefined') return;

  try {
    Object.values(AUTH_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('🔐 Auth state cleared from localStorage');
  } catch (error) {
    console.error('Failed to clear auth state from localStorage:', error);
  }
};

// Check if user is authenticated (with localStorage fallback)
export const isUserAuthenticated = (): boolean => {
  const authState = useAuthStore.getState();
  
  if (authState.isAuthenticated && authState.jwtToken) {
    return true;
  }

  // Fallback to localStorage check
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(AUTH_KEYS.TOKEN);
    const isAuthenticated = localStorage.getItem(AUTH_KEYS.IS_AUTHENTICATED) === 'true';
    return !!(token && isAuthenticated);
  }

  return false;
};

// Get JWT token (with localStorage fallback)
export const getJwtToken = (): string | null => {
  const authState = useAuthStore.getState();
  
  console.log('🔐 getJwtToken - Zustand state:', {
    jwtToken: !!authState.jwtToken,
    isAuthenticated: authState.isAuthenticated,
    userConnected: !!authState.userConnected
  });
  
  if (authState.jwtToken) {
    console.log('🔐 getJwtToken - Using Zustand token');
    return authState.jwtToken;
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const localStorageToken = localStorage.getItem(AUTH_KEYS.TOKEN);
    console.log('🔐 getJwtToken - localStorage token available:', !!localStorageToken);
    return localStorageToken;
  }

  console.log('🔐 getJwtToken - No token found');
  return null;
}; 