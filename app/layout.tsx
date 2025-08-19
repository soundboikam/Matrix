import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Matrix",
  description: "Matrix A&R Intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="theme-bw">{children}</body>
    </html>
  );
}


