import Onboarding from '../../components/onboarding/Onboarding';
import TimerDeepFocus from '../../components/modules/timer/TimerDeepFocus';
import FormMultistep from '../../components/onboarding/FormMultistep';
import JournalPage from '../journal/page';

export default function OnboardingPage() {
  return <div className="flex flex-col items-center justify-center h-screen mt-8">

    <div className="flex flex-col items-center justify-center gap-1 my-4">

    </div>

    {/* <FormMultistep /> */}

    <Onboarding
      isWelcomeStep={false}
    />

    <div className="flex flex-col items-center justify-center gap-1 my-4">
      <p className="text-center">Login and used your journal.</p>

      <p className="text-center">Add your goals, tasks and notes.</p>
      <p className="text-center">Level up and stay focused.</p>
    </div>

    {/* <JournalPage></JournalPage> */}
    <TimerDeepFocus isSetupEnabled={false} />

    <div
    // className="my-8 mt-18 sm:py-[var(--navbar-height)]"
    >

    </div>

  </div>;
} 