import { useState } from "react";
import Focus from "../focus";
import Learning from "../learning";
import Timer from "../timer";
import Tasks from "../tasks";
import styles from "../../../styles/components/dashboard.module.scss";
import Dashboard from "../dashboard";

export default function Console() {
    const [messages, setMessages] = useState<string[]>([]);

    const handleMessage = (message: string) => {
        setMessages([...messages, message]);
    }

    const [activeTab, setActiveTab] = useState<"focus" | "tasks" | "learning" | "timer" | "dashboard">("dashboard");
    return <div className="flex flex-col items-center justify-center">

        <div className={styles.consoleTabs}>
            <button 
                className={`${styles.consoleTab}${activeTab === "dashboard" ? " active" : ""}`}
                onClick={() => setActiveTab("dashboard")}>Dashboard</button>
            {/* <button 
                className={`${styles.consoleTab}${activeTab === "focus" ? " active" : ""}`}
                onClick={() => setActiveTab("focus")}>Focus</button>
            <button 
                className={`${styles.consoleTab}${activeTab === "tasks" ? " active" : ""}`}
                onClick={() => setActiveTab("tasks")}>Tasks</button>
            <button 
                className={`${styles.consoleTab}${activeTab === "learning" ? " active" : ""}`}
                onClick={() => setActiveTab("learning")}>Learning</button> */}
            <button 
                className={`console-tab${activeTab === "timer" ? " active" : ""}`}
                onClick={() => setActiveTab("timer")}>Timer</button>
        </div>

        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "focus" && <Focus />}
        {activeTab === "tasks" && <Tasks />}
        {activeTab === "learning" && <Learning />}
        {activeTab === "timer" && <Timer />}
    </div>;
}