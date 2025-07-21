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
  <aside className="hidden md:fixed md:top-0 md:left-0 md:h-full md:w-64 md:bg-white md:dark:bg-gray-900 md:border-r md:border-gray-200 md:dark:border-gray-700 md:flex md:flex-col md:items-center md:justify-start md:shadow z-40">
    {/* Placeholder content */}
    <span className="mt-8 text-gray-700 dark:text-gray-200 font-semibold">Left Sidebar</span>
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