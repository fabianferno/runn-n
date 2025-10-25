import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import ContextProvider from "@/context/index";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Territory - Fitness Gamified",
  description: "Capture territories and compete with clans",
  generator: "v0.app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get("cookie");

  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased bg-background text-foreground`}>
        <ContextProvider cookies={cookies}>{children}</ContextProvider>
      </body>
    </html>
  );
}
