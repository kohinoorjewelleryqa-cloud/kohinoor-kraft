import type { Metadata, Viewport } from "next";
import "../../globals.css";

export const metadata: Metadata = { title: "Kraft admin", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false, themeColor: "#123B2F" };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Marcellus&family=Figtree:wght@400;500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;600&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
