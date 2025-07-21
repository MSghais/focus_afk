import { useLoginWithOAuth } from '@privy-io/react-auth';

export default function LoginWithOAuth() {
  const { state, loading, initOAuth } = useLoginWithOAuth();

  const handleLogin = async () => {
      try {
          // The user will be redirected to OAuth provider's login page
          await initOAuth({ provider: 'google' });
      } catch (err) {
          // Handle errors (network issues, validation errors, etc.)
          console.error(err);
      }
  };

  return (
      <div>
          <button onClick={handleLogin} disabled={loading}>
              {loading ? 'Logging in...' : 'Log in with Google'}
          </button>
      </div>
  );
}