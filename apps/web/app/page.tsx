'use client'
import Onboarding from "../components/onboarding/Onboarding";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Focus from "../components/modules/focus";
import Tasks from "../components/modules/tasks";
import Settings from "../components/modules/settings";
import Dashboard from "../components/modules/dashboard";
import TimerMain from "../components/modules/timer";
import Mentor from "../components/modules/mentor";
import { useFocusAFKStore } from "../store/store";
import Learning from "../components/modules/learning";
import GoalsOverview from "../components/modules/goals/GoalsOverview";
import TimeLoading from "../components/small/loading/time-loading";

export default function Page() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const { ui } = useFocusAFKStore();

  // useEffect(() => {
  //   if (ready && !authenticated) {
  //     router.push('/profile');
  //   }
  // }, [ready, authenticated, router]);

  if (!ready) {
    return <div className="page w-full h-full flex items-center justify-center bg-[var(--background)]">
      <TimeLoading />
    </div>;
  }

  const renderCurrentModule = () => {
    switch (ui.currentModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'tasks':
        return <Tasks />;
      case 'timer':
        return <TimerMain isSetupEnabled={false} />;
      case 'goals':
        return <GoalsOverview />; // Goals component
      case 'learning':
        return <Learning />; // Learning paths component
      case 'mentor':
        return <Mentor />; // AI Mentor component
      case 'settings':
        return <Settings />; // Settings component is in console module
      case 'focus':
        return <Focus />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="page">
      <Dashboard />
      {/* {renderCurrentModule()} */}
    </div>
  );
}
