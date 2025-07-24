'use client'
import { useRouter } from "next/router";

import { usePrivy } from "@privy-io/react-auth";
import LoginPrivy from "../onboarding/LoginPrivy";
import { useUIStore } from "../../store/uiStore";
import { useAuthStore } from "../../store/auth";
import Onboarding from "../onboarding/Onboarding";
import LoginBackend from "./LoginBackend";
import { logClickedEvent } from "../../lib/analytics";

export default function PrivyUser({isLoggoutViewActive}: {isLoggoutViewActive: boolean}) {
    const { ready, authenticated, user, logout } = usePrivy();
    const { logout: logoutBackend , isAuthenticated} = useAuthStore();

    const { showToast } = useUIStore();
    if (!ready) {
        // Do nothing while the PrivyProvider initializes with updated user state
        return <></>;
    }

    const handleLogout = () => {
        logClickedEvent("logout_button_clicked");
        logout();
        logoutBackend(); // Use the new logout function that clears localStorage
        showToast({ message: "Logged out successfully", type: "success" });
    }

    if (ready && authenticated) {
        // Replace this code with however you'd like to handle an authenticated user
        return <div className="flex flex-col gap-2 items-center">
            {/* <p className="text-sm  ellipsis no-wrap">User {user?.wallet?.address} is logged in.</p> */}
            {isLoggoutViewActive && <button
                className="text-xs rounded-md border border-gray-300 px-4 py-2 rounded-md"

                onClick={() => {
                    handleLogout();
                }}>Logout</button>}

            {!isAuthenticated && <LoginBackend  />}
        </div>;
    }

    return <div className="flex flex-col gap-2 py-2">

        <Onboarding onNext={() => { }} />
    </div>;
}