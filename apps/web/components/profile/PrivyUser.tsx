'use client'
import { useRouter } from "next/router";

import { usePrivy } from "@privy-io/react-auth";
import LoginPrivy from "../onboarding/LoginPrivy";
import { useUIStore } from "../../store/uiStore";

export default function PrivyUser() {
    const { ready, authenticated, user, logout } = usePrivy();

    const { showToast } = useUIStore();
    if (!ready) {
        // Do nothing while the PrivyProvider initializes with updated user state
        return <></>;
    }

    const handleLogout = () => {
        logout();
        localStorage?.removeItem('token');
        localStorage?.removeItem('user');
        localStorage?.removeItem('evmAddress');
        localStorage?.removeItem('starknetAddress');
        localStorage?.removeItem('loginType');
        localStorage?.removeItem('isAuthenticated');
        showToast({ message: "Logged out successfully", type: "success" });
       
    }

    if (ready && authenticated) {
        // Replace this code with however you'd like to handle an authenticated user
        return <div>
            <p className="text-sm  ellipsis no-wrap">User {user?.wallet?.address} is logged in.</p>
            <button
            className="text-xs rounded-md border border-gray-300 px-4 py-2 rounded-md"
            
            onClick={() => {
                handleLogout();
            }}>Logout</button>
        </div>;
    }

    return <>

        <LoginPrivy onNext={() => { }} />
    </>;
}