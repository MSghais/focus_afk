'use client'
import { useState } from 'react';
import styles from './Onboarding.module.scss';
import { useLoginWithOAuth } from '@privy-io/react-auth';

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className={styles.onboardingContainer}>
      <h1 className={styles.heading}>Welcome to FocusFi</h1>
      <p className={styles.subtext}>Bet. Focus. Prove. Earn.</p>
      <p className={styles.subtext} style={{ marginBottom: '2.5rem' }}>
        Lorem ipsum dolor sit amet. consectetuer ada isicing eit. Auduis.
      </p>
      <button className={styles.button} onClick={onNext}>Continue</button>
    </div>
  );
}

export function SignUpStep({ onNext }: { onNext: () => void }) {
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
function PasscodeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className={styles.onboardingContainer}>
      <h1 className={styles.heading}>Create a Passcode</h1>
      <p className={styles.subtext}>Set a passcode to secure your account</p>
      <input className={styles.passcodeInput} type="password" maxLength={4} />
      <button className={styles.button} onClick={onNext}>Next</button>
    </div>
  );
}

function AllSetStep() {
  return (
    <div className={styles.onboardingContainer}>
      <h1 className={styles.heading}>You're All Set!</h1>
      <p className={styles.subtext}>You can now start using the app</p>
      <button className={styles.button}>Go to App</button>
    </div>
  );
}

const steps = [WelcomeStep, SignUpStep,
  //  PasscodeStep, 
  AllSetStep];

type StepProps = { onNext: () => void };

export default function Onboarding() {
  const [step, setStep] = useState(0);
  if (step < steps.length - 1) {
    const StepComponent = steps[step] as React.FC<{ onNext: () => void }>;
    return <StepComponent onNext={() => setStep(step + 1)} />;
  }
  // Last step does not need onNext
  return <AllSetStep />;
} 