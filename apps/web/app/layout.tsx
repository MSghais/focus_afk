import "../styles/index.scss";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import ClientLayout from "../components/ui/ClientLayout";
import React from "react";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Focus AFK - Productivity & Focus",
  description: "Boost your productivity with Focus AFK - the ultimate focus and task management app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en">
      <body className={geist.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
