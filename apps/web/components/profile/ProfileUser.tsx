'use client'
import { usePrivy } from "@privy-io/react-auth";
import PrivyUser from "./PrivyUser";
import Onboarding from "../onboarding/Onboarding";

export default function ProfileUser() {

    const { user } = usePrivy();
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
                    <h2>User Settings</h2>
                    <div className="flex flex-col gap-2">
                        <h3>Notifications</h3>
                        <input type="checkbox" />
                    </div>
                </div>
            )}
            
        </div>
    )
}