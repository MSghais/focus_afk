'use client'
import Onboarding from "../components/onboarding/Onboarding";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFocusAFKStore } from "../store/store";
import Link from "next/link";

export default function NotFoundPage() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const { ui } = useFocusAFKStore();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/profile');
    }
  }, [ready, authenticated, router]);



  return (
    <div className="page">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link href="/">Go back to the home page</Link>
    </div>
  );
}
