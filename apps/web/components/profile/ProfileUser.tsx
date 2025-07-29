'use client'
import { usePrivy } from "@privy-io/react-auth";
import PrivyUser from "./PrivyUser";
import Onboarding from "../onboarding/Onboarding";
import LoginBackend from "./LoginBackend";
import { useAuthStore } from "../../store/auth";

export default function ProfileUser({ isLoggoutViewActive = true }: { isLoggoutViewActive?: boolean }) {

    const { user } = usePrivy();

    const { userConnected, token, jwtToken, evmAddress, starknetAddress, loginType } = useAuthStore();
    return (
        <div>
            {!user && (
                <div className="flex flex-col gap-4">
                    <Onboarding onNext={() => { }} isWelcomeStep={false} />
                </div>
            )}
            {user && (
                <div className="flex flex-col gap-4 my-4">

                    {userConnected && (
                        <div className="flex flex-col gap-4 text-left">
                            <p className="text-sm text-ellipsis overflow-hidden whitespace-nowrap">User session: {userConnected?.loginType}</p>
                            <p
                                onClick={() => {
                                    navigator.clipboard.writeText(userConnected?.evmAddress || '');
                                }}
                                className="text-sm text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer">EVM: {userConnected?.evmAddress}</p>

                            {userConnected?.starknetAddress && (
                                <p
                                    onClick={() => {
                                        if (userConnected?.starknetAddress) {
                                            navigator.clipboard.writeText(userConnected?.starknetAddress || '');
                                        }
                                    }}
                                    className="text-sm text-ellipsis overflow-hidden whitespace-nowrap">Starknet: {userConnected?.starknetAddress}</p>
                            )}
                        </div>
                    )}

                    <PrivyUser isLoggoutViewActive={isLoggoutViewActive} />

                    {/* 
                    {!userConnected && (
                    )} */}

                    <LoginBackend />

                </div>
            )}


        </div>
    )
}