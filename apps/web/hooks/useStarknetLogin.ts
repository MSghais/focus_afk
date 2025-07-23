import { useCallback } from "react";
import { usePrivy, useSignMessage } from "@privy-io/react-auth";
import { useAuthStore } from "../store/auth";
import { saveAuthToStorage } from "../lib/auth";

export function useStarknetLogin() {
    const { user } = usePrivy();
    const { signMessage } = useSignMessage();
    const { 
        setUserConnected, 
        setJwtToken, 
        setStarknetAddress, 
        setLoginType, 
        setIsAuthenticated 
    } = useAuthStore();

    return useCallback(async () => {
        const message = `Login to Focus AFK at ${Date.now()}`;

        const signature = await signMessage({
            message: message,
        });

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/starknet-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: user?.wallet?.address, signature: signature.signature, message }),
        });

        if (!res.ok) throw new Error("Login failed");

        const data = await res.json();
        console.log("🔐 Starknet Login Response:", data);

        if (data.success && data.user && data.token) {
            // Update Zustand store
            setUserConnected(data.user);
            setJwtToken(data.token);
            setStarknetAddress(data.user.starknetAddress || user?.wallet?.address);
            setLoginType("starknet");
            setIsAuthenticated(true);

            // Save to localStorage
            saveAuthToStorage({
                token: data.token,
                user: data.user,
                starknetAddress: data.user.starknetAddress || user?.wallet?.address,
                loginType: "starknet"
            });

            console.log("🔐 Starknet Login successful - Auth state updated");
        }

        return data;
    }, [user?.wallet?.address, signMessage, setUserConnected, setJwtToken, setStarknetAddress, setLoginType, setIsAuthenticated]);
} 