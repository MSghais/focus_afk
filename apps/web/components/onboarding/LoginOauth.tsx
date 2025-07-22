'use client'
import { useState } from 'react';
import styles from './Onboarding.module.scss';
import { useLoginWithOAuth } from '@privy-io/react-auth';


export function LoginOauth({ onNext }: { onNext: () => void }) {
  const { state, loading, initOAuth } = useLoginWithOAuth();

  const handleLogin = async (provider: 'google' | 'apple' | "twitter") => {
    try {
        // The user will be redirected to OAuth provider's login page
        await initOAuth({ provider: provider });
    } catch (err) {
        // Handle errors (network issues, validation errors, etc.)
        console.error(err);
    }
};
  return (
    <div className={styles.onboardingContainer}>
      <h1 className={styles.heading}>Sign Up</h1>
      <p className={styles.subtext}>Sign up to get started</p>
      <button className={styles.altButton} onClick={() => handleLogin('google')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Google Icon Placeholder */}
        <span style={{ marginRight: 8 }}>G</span> Continue with Google
      </button>
      <button className={styles.altButton} onClick={() => handleLogin('apple')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Apple Icon Placeholder */}
        <span style={{ marginRight: 8 }}></span> Continue with Apple
      </button>
      <button className={styles.altButton} onClick={() => handleLogin('twitter')}>Sign up with Email</button>
    </div>
  );
}

