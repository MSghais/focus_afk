import CompanionOverview from "../../components/modules/Companion";

import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Companion Focus AFK",
    description: "Companion for Focus AFK. Be better, be faster, be stronger.",
};

export default function CompanionPage() {
    return (
        <div className="w-full h-full flex flex-col bg-[var(--background)]">
            <CompanionOverview />
        </div>
    )
}