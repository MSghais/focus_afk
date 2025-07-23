import Onboarding from '../../components/onboarding/Onboarding';
import TimerDeepFocus from '../../components/modules/timer/TimerDeepFocus';

export default function OnboardingPage() {
  return <div className="flex flex-col items-center justify-center h-screen">
    <Onboarding />
    <TimerDeepFocus isSetupEnabled={false} />
  </div>;
} 