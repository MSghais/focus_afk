import ProfileDashboard from '../../components/modules/dashboard/ProfileDashboard';
import Onboarding from '../../components/onboarding/Onboarding';
export default function ProfilePage() {
  return <div className="w-full h-full flex items-center justify-center bg-[var(--background)] my-8">

    <div>
      <Onboarding />
      <ProfileDashboard />
    </div>
    
  </div>;
} 