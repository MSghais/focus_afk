import ProfileDashboard from '../../components/modules/dashboard/ProfileDashboard';
import Onboarding from '../../components/onboarding/Onboarding';
import PrivyUser from '../../components/profile/PrivyUser';
export default function ProfilePage() {
  return <div className="w-full h-full flex items-center justify-center bg-[var(--background)] my-8">

    <div>
      <PrivyUser />
      <ProfileDashboard />
    </div>
    
  </div>;
} 