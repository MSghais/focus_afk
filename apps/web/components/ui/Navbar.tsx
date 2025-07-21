'use client';
import Link from "next/link";
import React from "react";
import ToggleTheme from "./ToggleTheme";


const Navbar = () => (
  <nav className="fixed top-0 left-0 w-full h-16 border-t border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] flex items-center justify-around shadow md:hidden z-50">
    {/* Placeholder content */}
    <ToggleTheme />
    <Link href="/onboarding">
      <span className="font-semibold">Onboarding</span>
    </Link>
    <Link href="/profile">
      <div className="w-10 h-10 bg-[var(--background)] rounded-full flex items-center justify-center">
        <span className="font-semibold">Profile</span>
      </div>
    </Link>
  </nav>
);

export default Navbar; 