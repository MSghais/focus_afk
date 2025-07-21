'use client';
import Link from "next/link";
import React from "react";

const toggleTheme = () => {
  if (typeof window !== "undefined") {
    const body = document.body;
    const isDark = body.getAttribute("data-theme") === "dark";
    body.setAttribute("data-theme", isDark ? "light" : "dark");
  }
};

const Navbar = () => (
  <nav className="fixed top-0 left-0 w-full h-16 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around shadow md:hidden z-50">
    {/* Placeholder content */}
    {/* <span className="text-gray-700 dark:text-gray-200 font-semibold">Bottom Bar</span> */}
    {/* <button
      className="px-3 py-1 rounded bg-[var(--brand-primary)] dark:bg-[var(--brand-accent)]"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
    >
      Toggle Theme
    </button> */}

    <Link href="/onboarding">
      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
        <span className="text-gray-700 dark:text-gray-200 font-semibold">Onboarding</span>
      </div>
    </Link>
    <Link href="/profile">
      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
        <span className="text-gray-700 dark:text-gray-200 font-semibold">Profile</span>
      </div>
    </Link>
  </nav>
);

export default Navbar; 