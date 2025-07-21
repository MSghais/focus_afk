'use client'
import Onboarding from "../components/onboarding/Onboarding";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Focus from "../components/modules/focus";
import Tasks from "../components/modules/tasks";
import Console from "../components/modules/console";
import Dashboard from "../components/modules/dashboard";
import Timer from "../components/modules/timer";
import { useFocusAFKStore } from "../lib/store";

export default function Page() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const { ui } = useFocusAFKStore();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/profile');
    }
  }, [ready, authenticated, router]);

  if (!ready) {
    return <div>Loading...</div>;
  }

  const renderCurrentModule = () => {
    switch (ui.currentModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'tasks':
        return <Tasks />;
      case 'timer':
        return <Timer />;
      case 'learning':
        return <Console />; // Goals component is in learning module
      case 'console':
        return <Console />; // Settings component is in console module
      case 'focus':
        return <Focus />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="page">
      {renderCurrentModule()}
    </div>
  );
}
