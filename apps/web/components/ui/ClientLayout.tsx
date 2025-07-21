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
      {/* Remove <html> and <body> tags to avoid hydration errors */}
      <>
        <Navbar />
        <div className={geist.className + " min-h-screen w-full bg-[var(--background)] text-[var(--foreground)] mt-24 md:m-2"}>
          <div className="flex flex-row min-h-screen w-full">
            <LeftSidebar />
            <main className="flex-1 w-full min-h-screen pb-16 md:pb-0 bg-[var(--background)] text-[var(--foreground)] flex justify-center items-stretch md:pl-64 md:pr-64">
              <div className="w-full max-w-5xl mx-auto flex flex-col flex-1">
                {children}
              </div>
            </main>
            {/* <RightSidebar /> */}
          </div>
          <BottomBar />
        </div>
      </>
    </Providers>
  );
}
