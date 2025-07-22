import { useState } from "react";
import { useLoginWithSms } from "@privy-io/react-auth";
import styles from './Onboarding.module.scss';
export default function LoginWithSms({ onNext }: { onNext: () => void }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const { state, sendCode, loginWithCode } = useLoginWithSms();

  return (
    <div className={styles.onboardingContainer}>
      {/* Prompt your user to enter their phone number */}
      <input onChange={(e) => setPhoneNumber(e.currentTarget.value)} value={phoneNumber} />
      {/* Once a phone number has been entered, send the OTP to it on click */}
      <button onClick={() => sendCode({ phoneNumber })}>Send Code</button>

      {/* Prompt your user to enter the OTP */}
      <input onChange={(e) => setCode(e.currentTarget.value)} value={code} />
      {/* Once an OTP has been entered, submit it to Privy on click */}
      <button onClick={() => loginWithCode({ code })}>Log in</button>
    </div>
  );
}