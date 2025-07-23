import React from "react";
import { useEvmLogin } from "../../hooks/useEvmLogin";
import { Icon } from "../small/icons";
import { useUIStore } from "../../store/uiStore";
import { useAuthStore } from "../../store/auth";
import { logClickedEvent } from "../../lib/analytics";
import { ButtonPrimary } from "../small/buttons";
import { saveAuthToStorage } from "../../lib/auth";

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

                // Use the new auth utility to save to localStorage
                saveAuthToStorage({
                    token: result.token,
                    user: result.user,
                    evmAddress: result?.user?.evmAddress,
                    starknetAddress: result?.user?.starknetAddress,
                    loginType: result?.user?.loginType || "ethereum",
                });

                // Handle success (e.g., store session, redirect)
                showToast({ message: "Login successful!", type: "success" });
            }

        } catch (error) {
            console.error("Login failed:", error);
            showToast({ message: "Login failed. Please try again.", type: "error" });
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <h3>Backend Login</h3>
            <ButtonPrimary onClick={handleLogin}>
                <Icon name="login" />
                Login with Wallet
            </ButtonPrimary>
        </div>
    );
}
