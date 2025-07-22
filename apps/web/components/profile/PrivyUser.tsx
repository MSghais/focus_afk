'use client'
import { useRouter } from "next/router";

import { usePrivy } from "@privy-io/react-auth";
import LoginPrivy from "../onboarding/LoginPrivy";

export default function PrivyUser() {
    const { ready, authenticated, user, logout } = usePrivy();

    if (!ready) {
        // Do nothing while the PrivyProvider initializes with updated user state
        return <></>;
    }

    if (ready && authenticated) {
        // Replace this code with however you'd like to handle an authenticated user
        return <div>
            <p className="text-sm  ellipsis no-wrap">User {user?.wallet?.address} is logged in.</p>
            <button onClick={() => {
                logout();
            }}>Logout</button>
        </div>;
    }

    return <>

        <LoginPrivy onNext={() => { }} />
    </>;
}