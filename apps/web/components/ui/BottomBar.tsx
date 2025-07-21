'use client';
import Link from "next/link";
import React from "react";
import ToggleTheme from "./ToggleTheme";
import { Icon, IconUser } from "../small/icons";


const BottomBar = () => (
  <nav className="fixed bottom-0 left-0 w-full h-16 border-t border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] flex items-center justify-around shadow md:hidden z-50">
    {/* Placeholder content */}

    <Link href="/">
      <div className="w-10 h-10 bg-[var(--background)] rounded-full flex items-center justify-center">
        <Icon name="home" size={24} />
      </div>
    </Link>
    <Link href="/profile">
      <div className="w-10 h-10 bg-[var(--background)] rounded-full flex items-center justify-center">
        <Icon name="user" size={24} />
      </div>
    </Link>
  </nav>
);

export default BottomBar; 