import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ContextProvider from "@/context/index";
import { headers } from "next/headers";
import { BottomNav } from "@/components/bottom-nav";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TouchGrass - Running App",
  description: "Get outside and TouchGrass",
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
        <ContextProvider cookies={cookies}>
          {children} <BottomNav />
        </ContextProvider>
      </body>
    </html>
  );
}
