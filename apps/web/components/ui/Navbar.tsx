'use client';
import React from "react";
import { useFocusAFKStore } from "../../lib/store";

const Navbar = () => {
  const { setTheme, ui } = useFocusAFKStore();

  const toggleTheme = () => {
    const newTheme = ui.theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    if (typeof window !== "undefined") {
      const body = document.body;
      body.setAttribute("data-theme", newTheme);
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full h-16 border-b border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] flex items-center justify-between px-4 shadow-lg md:hidden z-50 backdrop-blur-sm bg-opacity-95">
      {/* Brand */}
      <div className="flex items-center">
        <h1 className="text-xl font-bold bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[var(--brand-accent)] bg-clip-text text-transparent">
          Focus AFK
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl bg-[var(--border)] flex items-center justify-center transition-all duration-200 ease-in-out transform hover:scale-110"
          aria-label="Toggle theme"
        >
          <span className="text-lg">
            {ui.theme === 'dark' ? '☀️' : '🌙'}
          </span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar; 