"use client";

import "../../styles/index.css";
import { Geist } from "next/font/google";
import BottomBar from "./BottomBar";
import LeftSidebar from "./LeftSidebar";
import Navbar from "./Navbar";
import Providers from "../../providers/Providers";
import React from "react";
import RightSidebar from "./RightSidebar";

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
      <div className={`${geist.className} min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] flex flex-col`}>
        {/* Mobile Navbar - Fixed at top */}
        <Navbar />
        
        {/* Desktop Sidebar - Fixed at left */}
        <LeftSidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 w-full bg-[var(--background)] text-[var(--foreground)] transition-all duration-300 ease-in-out
          md:ml-64 md:pt-0 pt-16 pb-16 md:pb-0">
          <div className="w-full h-full min-h-screen">
            <div className="container-responsive mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
              {children}
            </div>
          </div>
        </main>

        {/* Mobile Bottom Bar - Fixed at bottom */}
        <BottomBar />
      </div>
    </Providers>
  );
}
