import OnboardingPageComponent from '../../components/onboarding/page/OnboardingPageComponent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Onboarding to be Focus AFK AI',
  description: 'Onboarding on Focus Productivity app with AI',
};
  
export default function OnboardingPage() {

  return (
    <OnboardingPageComponent />
  );
} 