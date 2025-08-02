"use client";

import { useEffect } from "react";
import { useAuthStore } from "../../store/auth";
import { useFocusAFKStore } from "../../store/store";
import { useUIStore } from "../../store/uiStore";
import { useRouter } from "next/navigation";

export default function OnboardingCheck() {
    const { userConnected, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const handleCheck = () => {
        const isOnboarding = localStorage.getItem("onboarding");
        if (!userConnected && !isAuthenticated && !isOnboarding) {
            localStorage.setItem("onboarding", "true");
            router.push("/onboarding");
        }
    }
    useEffect(() => {
      handleCheck();
    }, [userConnected, isAuthenticated, ]);
    return (
        <div>
            {/* <h1>Onboarding Check</h1> */}
        </div>
    );
}