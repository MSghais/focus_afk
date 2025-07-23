import DashboardQuests from '../../components/modules/dashboard/DasboardQuests';
// import Onboarding from '../../components/onboarding/Onboarding';
export default function ProfilePage() {
  return <div className="w-full h-full flex items-center justify-center bg-[var(--background)] my-8">

    <div>
      {/* <Onboarding /> */}
      <DashboardQuests />
    </div>
    
  </div>;
} 