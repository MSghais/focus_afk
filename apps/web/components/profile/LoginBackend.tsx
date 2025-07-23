import React from "react";
import { useEvmLogin } from "../../hooks/useEvmLogin";
import { Icon } from "../small/icons";
import { useUIStore } from "../../store/uiStore";
import { useAuthStore } from "../../store/auth";
import { logClickedEvent } from "../../lib/analytics";
import { ButtonPrimary } from "../small/buttons";

export default function LoginBackend() {
    const evmLogin = useEvmLogin();

    const { showModal, showToast } = useUIStore();

    const { setUserConnected, setToken, setJwtToken, setEvmAddress, setStarknetAddress, setLoginType, setIsAuthenticated } = useAuthStore();
    const handleLogin = async () => {
        try {

            logClickedEvent('try_login_backend');
            const result = await evmLogin();
            console.log("result", result);

            if (result?.success) {
                logClickedEvent('login_backend_success');
                setUserConnected(result.user);
                setToken(result.token);
                // The backend returns 'token', not 'jwtToken'
                setJwtToken(result.token);
                setEvmAddress(result?.user?.evmAddress);
                setStarknetAddress(result?.user?.starknetAddress);
                setLoginType(result?.user?.loginType || "ethereum");
                setIsAuthenticated(true);

                localStorage?.setItem('token', result.token);
                localStorage?.setItem('user', JSON.stringify(result.user));
                localStorage?.setItem('evmAddress', result?.user?.evmAddress);
                localStorage?.setItem('starknetAddress', result?.user?.starknetAddress);
                localStorage?.setItem('loginType', result?.user?.loginType || "ethereum");
                localStorage?.setItem('isAuthenticated', 'true');

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
