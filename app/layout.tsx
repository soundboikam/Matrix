import "./globals.css";
import type { Metadata } from "next";
import Providers from "../components/Providers";

export const metadata: Metadata = {
  title: "Matrix",
  description: "Matrix A&R Intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="theme-bw">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}


