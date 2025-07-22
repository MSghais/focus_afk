import Tasks from "../../components/modules/tasks";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tasks Focus AFK",
    description: "Tasks for Focus AFK. Be better, be faster, be stronger.",
};

export default function TasksPage() {
    return (
        <div className="w-full h-full flex flex-col p-6 bg-[var(--background)]">
            <Tasks />
        </div>
    )
}