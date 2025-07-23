'use client';

import {PrivyProvider} from '@privy-io/react-auth';

export default function Providers({children}: {children: React.ReactNode}) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!}
      config={{
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets'
          }
        },
        // Add OAuth configuration
        loginMethods: ['email', 'wallet', 'google', "sms" , "farcaster"],
        // redirectUri: 'http://localhost:3000/profile',
        appearance: {
          theme: 'dark',
          accentColor: '#676FFF',
        },
        // Add default chain configuration
        // defaultChain: 1, // Ethereum mainnet
      }}
    >
      {children}
    </PrivyProvider>
  );
}