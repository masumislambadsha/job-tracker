import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobDesk — Personal Job Application Pipeline & Analytics",
  description:
    "Structured personal job-application tracker with kanban board, follow-up alerts, curated job portal directory, and resume variant callback analytics.",
  keywords: [
    "job tracker",
    "application pipeline",
    "kanban job tracker",
    "remote dev jobs",
    "career management",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans bg-[#070b12] text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
