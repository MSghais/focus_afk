import React from "react";
import { useEvmLogin } from "../../hooks/useEvmLogin";
import { Icon } from "../small/icons";
import { useUIStore } from "../../store/uiStore";
import { logClickedEvent } from "../../lib/analytics";
import { ButtonPrimary } from "../small/buttons";

export default function LoginBackend() {
    const evmLogin = useEvmLogin();
    const { showToast } = useUIStore();

    const handleLogin = async () => {
        try {
            logClickedEvent('try_login_backend');
            const result = await evmLogin();
            console.log("🔐 Login result:", result);

            if (result?.success) {
                logClickedEvent('login_backend_success');
                showToast({ message: "Login successful!", type: "success" });
            } else {
                showToast({ message: "Login failed. Please try again.", type: "error" });
            }
        } catch (error) {
            console.error("Login failed:", error);
            showToast({ message: "Login failed. Please try again.", type: "error" });
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <h3>Sign to your account</h3>
            <ButtonPrimary onClick={handleLogin}>
                <Icon name="login" />
                Sign with Wallet
            </ButtonPrimary>
        </div>
    );
}
