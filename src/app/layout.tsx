import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs'
import { OnboardingGuard } from '@/components/onboarding/OnboardingGuard'
import { MascotProvider } from '@/contexts/MascotContext'
import "./globals.css";

export const metadata: Metadata = {
  title: "Kombu - Learn Through What You Love",
  description: "AI-powered Japanese ↔ English language learning through real conversations and what you actually care about.",
  keywords: ["language learning", "Japanese", "English", "AI", "kombu"],
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
          <meta name="theme-color" content="#bbead6" />
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
