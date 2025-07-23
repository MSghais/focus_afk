'use client';
import TimerMain from "../../components/modules/timer";
import ChatAi from "../../components/modules/ChatAi";
import { useState } from "react";

export default function TimePageComponent() {
    const [isViewChatAi, setIsViewChatAi] = useState(false);
    return (
        <div className="w-full h-full flex flex-col py-4 bg-[var(--background)]">
            <TimerMain isSetupEnabled={false}
                timerTypeProps="deep"
            />

            <button onClick={() => setIsViewChatAi(!isViewChatAi)}>
                {isViewChatAi ? "Hide Chat AI" : "Show Chat AI"}
            </button>

            {isViewChatAi && <ChatAi isSelectMentorViewEnabled={true}></ChatAi>}
        </div>
    )
}