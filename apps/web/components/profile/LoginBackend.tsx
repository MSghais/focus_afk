import React from "react";
import { useEvmLogin } from "../../hooks/useEvmLogin";
import { Icon } from "../small/icons";
import { useUIStore } from "../../store/uiStore";
import { useAuthStore } from "../../store/auth";
import { logClickedEvent } from "../../lib/analytics";
import { ButtonPrimary } from "../ui/Buttons";

export default function LoginBackend() {
    const evmLogin = useEvmLogin();

    const { showModal, showToast } = useUIStore();

    const { setUserConnected, setToken, setJwtToken, setEvmAddress, setStarknetAddress, setLoginType } = useAuthStore();
    const handleLogin = async () => {
        try {

            logClickedEvent('try_login_backend');
            const result = await evmLogin();
            console.log("result", result);

            if (result?.success) {
                logClickedEvent('login_backend_success');
                setUserConnected(result.user);
                setToken(result.token);
                setJwtToken(result.jwtToken || result?.token);
                setEvmAddress(result?.user?.evmAddress);
                setStarknetAddress(result?.user?.starknetAddress);
                setLoginType(result?.user?.loginType || "ethereum");
                // Handle success (e.g., store session, redirect)
                showToast({ message: "Login successful!", type: "success" });
            }

        } catch (e) {
            logClickedEvent('login_backend_failed');
            showToast({ message: "Login failed: " + (e as Error).message, type: "error" });
        }
    };

    return (
        <div className="flex items-center justify-center gap-2">
            <ButtonPrimary onClick={handleLogin}>
                <Icon name="login" />
                <p>Sign</p>
            </ButtonPrimary>
        </div>
    );
}
