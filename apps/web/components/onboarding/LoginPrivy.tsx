import { useEffect, useState } from "react";
import styles from './Onboarding.module.scss';
import { useLogin, useLoginWithEmail, usePrivy } from '@privy-io/react-auth';
import { logClickedEvent } from "../../lib/analytics";

export default function LoginPrivy({ onNext }: { onNext: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const { login } = useLogin();
  const { ready, authenticated, user } = usePrivy();


  useEffect(() => {
    if (ready && authenticated) {
      logClickedEvent('login_privy_success');
      onNext();
    }
  }, [ready, authenticated, onNext]);

  return (
    <div className={styles.onboardingContainer}>
      <h1 className={styles.heading}>Sign Up</h1>
      <p className={styles.subtext}>Sign up to get started</p>
      {/* <input onChange={(e) => setEmail(e.currentTarget.value)} value={email} /> */}
      <button
        className={styles.button}
        onClick={() => {
          logClickedEvent('try_login_privy');
          login();
        }}>Login</button>
    </div>
  );
}