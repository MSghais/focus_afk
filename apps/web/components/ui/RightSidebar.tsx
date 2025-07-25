'use client';
import React from "react";
import AnalyticsDashboard from "../modules/dashboard/AnalyticsDashboard";
import QuestList from "../modules/quests/QuestList";
import Badges from "../profile/Badges";

const toggleTheme = () => {
  if (typeof window !== "undefined") {
    const body = document.body;
    const isDark = body.getAttribute("data-theme") === "dark";
    body.setAttribute("data-theme", isDark ? "light" : "dark");
  }
};

const RightSidebar = () => (
  <aside className="hidden md:fixed md:top-0 md:right-0 md:h-full md:w-64 bg-[var(--background)] text-[var(--foreground)] border-l border-[var(--border)] md:flex md:flex-col md:items-center md:justify-start md:shadow z-40">
    {/* Placeholder content */}
    {/* <span className="mt-8 font-semibold">Right Sidebar</span> */}
    {/* <button
      className="mt-4 px-3 py-1 rounded bg-[var(--brand-primary)] text-white dark:bg-[var(--brand-accent)]"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
    >
      Toggle Theme
    </button> */}

    <div className="flex flex-col gap-4 max-w-[var(--sidebar-width)]">   
      <Badges   
        isEnabledRefreshButton={false}
        isDailyBadgeEnabled={false}
      />
      <QuestList quests={[]} />
    </div>


    {/* <AnalyticsDashboard />   */}
  </aside>
);

export default RightSidebar; 