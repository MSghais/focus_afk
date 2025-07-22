'use client'
import { usePrivy } from "@privy-io/react-auth";
import PrivyUser from "./PrivyUser";
import Onboarding from "../onboarding/Onboarding";
import LoginBackend from "./LoginBackend";
import { useAuthStore } from "../../store/auth";

export default function ProfileUser() {

    const { user } = usePrivy();

    const { userConnected, token, jwtToken, evmAddress, starknetAddress, loginType } = useAuthStore();
    return (
        <div>
            <h1>Profile User</h1>
            {!user && (
                <div className="flex flex-col gap-4">
                    <Onboarding onNext={() => { }} />
                </div>
            )}
            {user && (
                <div className="flex flex-col gap-4 my-4">
                    <PrivyUser />

                    {userConnected && (
                        <div className="flex flex-col gap-4">
                            <h3>User Connected</h3>
                            <p>{userConnected?.userAddress}</p>
                            <p>{userConnected?.evmAddress}</p>
                            <p>{userConnected?.starknetAddress}</p>
                            <p>{userConnected?.loginType}</p>
                        </div>
                    )}

                    {!userConnected && (
                        <LoginBackend />
                    )}

                </div>
            )}


        </div>
    )
}