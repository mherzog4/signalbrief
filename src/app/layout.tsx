import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Signalbrief — Walk into every call ready",
  description: "Open-source, just-in-time account research delivered to every seller in Slack.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
