'use client';
import TimerMain from "../../components/modules/timer";
import ChatAi from "../../components/modules/ChatAi";
import AchievementToast, { useAchievementNotifications } from "../../components/small/AchievementToast";
import { useState } from "react";

export default function TimePageComponent() {
    const [isViewChatAi, setIsViewChatAi] = useState(false);
    const { notifications, removeNotification } = useAchievementNotifications();
    
    return (
        <div className="w-full h-full flex flex-col py-4 bg-[var(--background)]">
            <TimerMain isSetupEnabled={false}
                timerTypeProps="deep"
            />

            <button onClick={() => setIsViewChatAi(!isViewChatAi)}>
                {isViewChatAi ? "Hide Chat AI" : "Show Chat AI"}
            </button>

            {isViewChatAi && <ChatAi isSelectMentorViewEnabled={true}></ChatAi>}
            
            {/* Achievement Notifications */}
            {notifications.map((achievementId) => (
                <AchievementToast
                    key={achievementId}
                    achievementId={achievementId}
                    onClose={() => removeNotification(achievementId)}
                />
            ))}
        </div>
    )
}