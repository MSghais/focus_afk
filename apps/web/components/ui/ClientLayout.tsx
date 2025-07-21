"use client";

import "../../styles/index.css";
import { Geist } from "next/font/google";
import BottomBar from "./BottomBar";
import LeftSidebar from "./LeftSidebar";
import Navbar from "./Navbar";
import Providers from "../../providers/Providers";
import React from "react";

const geist = Geist({ subsets: ["latin"] });

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  // Set dark theme by default on first load
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const body = document.body;
      if (!body.getAttribute('data-theme')) {
        body.setAttribute('data-theme', 'dark');
      }
    }
  }, []);

  return (
    <Providers>
      <div className={`${geist.className} min-h-screen w-full bg-[var(--background)] text-[var(--foreground)]`}>
        {/* Mobile Navbar */}
        <Navbar />
        
        {/* Desktop Sidebar */}
        <LeftSidebar />
        
        {/* Main Content */}
        <main className="flex-1 w-full min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-all duration-300 ease-in-out
          md:ml-64 md:pt-0 pt-16 pb-16 md:pb-0">
          <div className="w-full h-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
            {children}
          </div>
        </main>
        
        {/* Mobile Bottom Bar */}
        <BottomBar />
      </div>
    </Providers>
  );
}
