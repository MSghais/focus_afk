'use client';
import React from "react";

const toggleTheme = () => {
  if (typeof window !== "undefined") {
    const body = document.body;
    const isDark = body.getAttribute("data-theme") === "dark";
    body.setAttribute("data-theme", isDark ? "light" : "dark");
  }
};

const LeftSidebar = () => (
  <aside className="hidden md:fixed md:top-0 md:left-0 md:h-full md:w-64 bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] md:flex md:flex-col md:items-center md:justify-start md:shadow z-40">
    {/* Placeholder content */}
    <span className="mt-8 font-semibold">Left Sidebar</span>
    <button
      className="mt-4 px-3 py-1 rounded bg-[var(--brand-primary)] text-white dark:bg-[var(--brand-accent)]"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
    >
      Toggle Theme
    </button>
  </aside>
);

export default LeftSidebar; 