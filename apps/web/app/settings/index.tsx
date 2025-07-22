import Settings from "../../components/modules/settings";

import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Settings Focus AFK",
    description: "Settings for Focus AFK. Be better, be faster, be stronger.",
};

export default function SettingsPage() {
    return (
        <div className="w-full h-full flex flex-col p-6 bg-[var(--background)]">
            <Settings />
        </div>
    )
}