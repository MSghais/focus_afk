import { useSignupWithPasskey } from '@privy-io/react-auth';
import styles from './Onboarding.module.scss';  
export default function LoginPasskey({ onNext }: { onNext: () => void }) {
  const { signupWithPasskey } = useSignupWithPasskey();

  return (
    <div className={styles.onboardingContainer}>
      <button onClick={signupWithPasskey}>Sign up with passkey</button>
    </div>
  );
}