'use client'
import { useState } from 'react';
import styles from './Onboarding.module.scss';
// import { useLoginWithOAuth } from '@privy-io/react-auth';
// import { LoginOauth } from './LoginOauth';
import LoginPrivy from './LoginPrivy';
// import LoginEmail from './LoginEmail';
// import LoginSms from './LoginSms';
// import LoginPasskey from './LoginPasskey';
import Link from 'next/link';
import LoginBackend from '../profile/LoginBackend';
  
function LoginStep({ onNext }: { onNext: () => void }) {
  return (
    <div className={styles.onboardingContainer}>
      {/* <h1 className={styles.heading}>Login</h1>
      <p className={styles.subtext}>Login to your account</p> */}
      <LoginPrivy onNext={onNext} />
      {/* <LoginEmail onNext={onNext} />
      <LoginSms onNext={onNext} />
      <LoginPasskey onNext={onNext} /> */}
    </div>
  );
}
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

function AllSetStep({ onNext }: { onNext?: () => void }) {
  return (
    <div className={styles.onboardingContainer}>
      <h1 className={styles.heading}>You're All Set!</h1>
      <p className={styles.subtext}>You can now start using the app</p>

      <button className={styles.button} >
        <Link href="/">Go to App</Link>
      </button>
    </div>
  );
}
const steps = [WelcomeStep,
  LoginStep,
  LoginBackend,
  //  PasscodeStep, 
  AllSetStep];

type StepProps = { onNext: () => void };

export default function Onboarding({ onNext }: { onNext?: () => void }) {
  const [step, setStep] = useState(0);
  if (step < steps.length - 1) {
    const StepComponent = steps[step] as React.FC<{ onNext: () => void }>;
    return <StepComponent onNext={() => setStep(step + 1)} />;
  }
  // Last step does not need onNext
  return <AllSetStep onNext={onNext} />;
} 