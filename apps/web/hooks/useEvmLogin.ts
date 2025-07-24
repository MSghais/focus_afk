import { useCallback } from "react";
import { usePrivy, useSignMessage } from "@privy-io/react-auth";
import { useAuthStore } from "../store/auth";
import { saveAuthToStorage } from "../lib/auth";

export function useEvmLogin() {
    const { user } = usePrivy();
    const { signMessage } = useSignMessage();
    const { 
        setUserConnected, 
        setJwtToken, 
        setEvmAddress, 
        setLoginType, 
        setIsAuthenticated 
    } = useAuthStore();

    return useCallback(async () => {
        const message = `Login to Focus AFK at ${Date.now()}`;

        const signature = await signMessage({
            message: message,
        });

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/evm-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: user?.wallet?.address, signature: signature.signature, message }),
            credentials: 'include', // Required for CORS with credentials
            mode: 'cors', // Explicitly set CORS mode
        });

        console.log("🔐 EVM Login Response:", res);
        if (!res.ok) throw new Error("Login failed");

        const data = await res.json();
        console.log("🔐 EVM Login Response:", data);

        if (data.success && data.user && data.token) {
            // Update Zustand store
            setUserConnected(data.user);
            setJwtToken(data.token);
            setEvmAddress(data.user.evmAddress || user?.wallet?.address);
            setLoginType("ethereum");
            setIsAuthenticated(true);

            // Save to localStorage
            saveAuthToStorage({
                token: data.token,
                user: data.user,
                evmAddress: data.user.evmAddress || user?.wallet?.address,
                loginType: "ethereum"
            });

            console.log("🔐 EVM Login successful - Auth state updated");
        }

        return data;
    }, [user?.wallet?.address, signMessage, setUserConnected, setJwtToken, setEvmAddress, setLoginType, setIsAuthenticated]);
}
