import { useCallback } from "react";
import { usePrivy, useSignMessage } from "@privy-io/react-auth";

export function useEvmLogin() {
    const { user } = usePrivy();
    const { signMessage } = useSignMessage();

    return useCallback(async () => {
        const message = `Login to Focus AFK at ${Date.now()}`;


        const signature = await signMessage({
            message: message,
        });

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/evm-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: user?.wallet?.address, signature: signature.signature, message }),
        });

        
        if (!res.ok) throw new Error("Login failed");

        const data = await res.json();
        console.log("data", data);
        return data;
    }, []);
}
