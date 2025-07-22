import "../styles/index.scss";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import ClientLayout from "../components/ui/ClientLayout";
import React from "react";
import Script from "next/script";

const geist = Geist({ subsets: ["latin"] });
const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS || '';

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
      <head>
        <Script
          // strategy="lazyOnload"
          strategy="afterInteractive"

          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          // strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
          }}
        />
      </head>
      <body className={geist.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
