import { useState } from "react";
import styles from './Onboarding.module.scss';
import { useLogin, useLoginWithEmail } from '@privy-io/react-auth';

export default function LoginPrivy({ onNext }: { onNext: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const { login } = useLogin();

  return (
      <div className={styles.onboardingContainer}>
              <h1 className={styles.heading}>Sign Up</h1>
              <p className={styles.subtext}>Sign up to get started</p>
          {/* <input onChange={(e) => setEmail(e.currentTarget.value)} value={email} /> */}
          <button
          className={styles.button}
          onClick={() => login()}>Login</button>
      </div>
  );
}