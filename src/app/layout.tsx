import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import "./globals.css";

export const metadata: Metadata = {
  title: "Zlang - Learn Through What You Love",
  description: "Revolutionary AI-powered language learning. Japanese ↔ English through anime, NBA, memes, and real culture.",
  keywords: ["language learning", "Japanese", "English", "AI", "anime", "culture"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className="font-body antialiased min-h-screen bg-background text-foreground relative">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
