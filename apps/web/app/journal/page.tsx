import { Metadata } from "next";
import JournalMainComponent from "../../components/modules/Journal";

export const metadata: Metadata = {
    title: "Journal Focus AFK",
    description: "Journal for Focus AFK. Be better, be faster, be stronger.",
};

export default function JournalPage() {
    return (
        <div className="w-full h-full flex flex-col bg-[var(--background)]">
            <JournalMainComponent />
        </div>
    )
}