"use client";

import "../../styles/index.scss";
import { Geist } from "next/font/google";
import BottomBar from "./BottomBar";
import LeftSidebar from "./LeftSidebar";
import Navbar from "./Navbar";
import Providers from "../../providers/Providers";
import React, { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

const geist = Geist({ subsets: ["latin"] });

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();

  // useEffect(() => {
  //   if (ready && !authenticated) {
  //     router.push('/onboarding');
  //   }
  // }, [ready, authenticated, router]);
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
      <div className={`${geist.className} layout-container bg-[var(--background)]`}>
        {/* Mobile Navbar - Fixed at top */}
        <Navbar />
        
        {/* Desktop Sidebar - Fixed at left */}
        <LeftSidebar />
        
        {/* Main Content Area */}
        <main className="main-content">
          <div className="content-container">
            <div className="container-responsive bg-[var(--background)]">
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
