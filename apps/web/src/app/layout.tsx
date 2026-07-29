import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LenisProvider } from "@/shared/components/LenisProvider";
import { AmbientBackground } from "@/shared/components/AmbientBackground";
import { ThemeProvider } from "@/shared/components/ThemeProvider";
import { BackgroundProvider } from "@/shared/context/BackgroundContext";
import { ShopProvider } from "@/shared/context/ShopContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Scaffold — Socratic Learning Platform",
  description: "Learn through the Socratic method with NeuroFlow micro-lessons",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <BackgroundProvider>
            <ShopProvider>
              <AmbientBackground />
              <LenisProvider>
                <div className="relative z-10">
                  {children}
                </div>
              </LenisProvider>
            </ShopProvider>
          </BackgroundProvider>
        </ThemeProvider>

      </body>
    </html>

  );
}
/* Next.js layout HMR trigger */
