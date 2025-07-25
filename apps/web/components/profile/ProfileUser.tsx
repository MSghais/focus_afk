'use client'
import { usePrivy } from "@privy-io/react-auth";
import PrivyUser from "./PrivyUser";
import Onboarding from "../onboarding/Onboarding";
import LoginBackend from "./LoginBackend";
import { useAuthStore } from "../../store/auth";

export default function ProfileUser({isLoggoutViewActive = true}: {isLoggoutViewActive?: boolean}) {

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
                        <div className="flex flex-col gap-4">
                            <h3>User session</h3>
                            <p className="text-sm text-ellipsis overflow-hidden whitespace-nowrap">Evm: {userConnected?.evmAddress}</p>
                            <p className="text-sm text-ellipsis overflow-hidden whitespace-nowrap">Starknet: {userConnected?.starknetAddress}</p>
                            <p className="text-sm text-ellipsis overflow-hidden whitespace-nowrap">Login Type: {userConnected?.loginType}</p>
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