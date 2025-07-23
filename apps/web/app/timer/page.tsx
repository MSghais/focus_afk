import TimePageComponent from "./TimePageComponent";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Timer Focus AFK",
    description: "Timer for Focus AFK. Be better, be faster, be stronger.",
};

export default function TimerPage() {
    return (
        <div className="w-full h-full flex flex-col p-6 bg-[var(--background)]">
            <TimePageComponent />

           
        </div>
    )
}