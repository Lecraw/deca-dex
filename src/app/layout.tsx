import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nexari — AI-Powered DECA Competition Assistant",
  description:
    "Build winning DECA competition projects with AI. From idea to pitch deck in one platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" {...{ suppressHydrationMismatch: true }}>
      <body
        className={`${jakarta.variable} ${inter.variable} ${jetbrains.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
