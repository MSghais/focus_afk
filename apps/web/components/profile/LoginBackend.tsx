import React from "react";
import { useEvmLogin } from "../../hooks/useEvmLogin";
import { Icon } from "../small/icons";

export default function LoginBackend() {
    const evmLogin = useEvmLogin();

    const handleLogin = async () => {
        try {
            const result = await evmLogin();
            // Handle success (e.g., store session, redirect)
            alert("Login successful!");
        } catch (e) {
            alert("Login failed: " + (e as Error).message);
        }
    };

    return (
        <div className="flex items-center justify-center gap-2">
            <button className="bg-[var(--brand-primary)] border-radius border-2 border-[var(--brand-primary)] p-4 flex items-center gap-2" onClick={handleLogin}>
                <Icon name="login" />
                <p>Login</p>
            </button>
        </div>
    );
}
