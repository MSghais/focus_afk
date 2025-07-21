"use client";

import "../../styles/index.scss";
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
      <div className={`${geist.className} layout-container`}>
        {/* Mobile Navbar - Fixed at top */}
        <Navbar />
        
        {/* Desktop Sidebar - Fixed at left */}
        <LeftSidebar />
        
        {/* Main Content Area */}
        <main className="main-content">
          <div className="content-container">
            <div className="container-responsive">
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
