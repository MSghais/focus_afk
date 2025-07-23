import Mentor from "../../components/modules/mentor";

import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Mentor Focus AFK",
    description: "Mentor for Focus AFK. Be better, be faster, be stronger.",
};

export default function MentorPage() {
    return (
        <div className="w-full h-full flex flex-col bg-[var(--background)]">
            <Mentor />
        </div>
    )
}