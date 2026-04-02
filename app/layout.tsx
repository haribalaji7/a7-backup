import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Agri AI – Intelligent Agriculture Platform",
  description: "Modern farm management dashboard with analytics, maps, weather, and finance tracking",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
