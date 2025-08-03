'use client';

import { useState } from "react";
import Goals from "../goals/GoalsOverview";
import Tasks from "../tasks";
import NotesOverview from "../Notes";
import CalendarIntegration from "../calendar/CalendarIntegration";

export default function JournalMainComponent() {
    const [activeTab, setActiveTab] = useState<"notes" | "goals" | "tasks" | "calendar">('goals');

    return (
        <div className="flex flex-col gap-2 p-2 w-full">
            {/* <h1 className="text-2xl font-bold">Journal</h1> */}
            <div className="flex flex-row gap-2 justify-center my-4">

                <button
                    className={`cursor-pointer rounded-md p-2 ${activeTab === 'goals' ? 'border border-gray-300' : ''}`}
                    onClick={() => setActiveTab('goals')}> 🎯 Goals</button>
                <button
                    className={`cursor-pointer rounded-md p-2 ${activeTab === 'tasks' ? 'border border-gray-300' : ''}`}
                    onClick={() => setActiveTab('tasks')}>🗒️ Tasks</button>
                <button
                    className={`cursor-pointer rounded-md p-2 ${activeTab === 'notes' ? 'border border-gray-300' : ''}`}
                    onClick={() => setActiveTab('notes')}>📚 Notes</button>
                <button
                    className={`cursor-pointer rounded-md p-2 ${activeTab === 'calendar' ? 'border border-gray-300' : ''}`}
                    onClick={() => setActiveTab('calendar')}>📅 Calendar</button>
                </div>
            {activeTab === 'notes' && <NotesOverview />}
            {activeTab === 'goals' && <Goals />}
            {activeTab === 'tasks' && <Tasks />}
            {activeTab === 'calendar' && <CalendarIntegration />}
        </div>
    );
}