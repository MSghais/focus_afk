import { useState } from "react";
import { useLoginWithEmail } from "@privy-io/react-auth";
import styles from './Onboarding.module.scss';
export default function LoginEmail({ onNext }: { onNext: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const { sendCode, loginWithCode } = useLoginWithEmail();

  return (
      <div className={styles.onboardingContainer}>
          <input onChange={(e) => setEmail(e.currentTarget.value)} value={email} />
          <button onClick={() => sendCode({ email })}>Send Code</button>
          <input onChange={(e) => setCode(e.currentTarget.value)} value={code} />
          <button onClick={() => loginWithCode({ code })}>Login</button>
      </div>
  );
}