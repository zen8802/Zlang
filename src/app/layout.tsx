import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import { OnboardingGuard } from '@/components/onboarding/OnboardingGuard'
import { MascotProvider } from '@/contexts/MascotContext'
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
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#1B4F8A" />
        </head>
        <body className="font-body antialiased min-h-screen bg-background text-foreground relative">
          <OnboardingGuard>
            <MascotProvider>
              {children}
            </MascotProvider>
          </OnboardingGuard>
        </body>
      </html>
    </ClerkProvider>
  );
}
