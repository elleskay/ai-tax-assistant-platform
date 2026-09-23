import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/app-shell";
import { ThemeSync } from "@/components/theme-sync";

// Variable weights, so headlines can sit at 450-500 instead of bold.
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Tax Assistant Platform",
  description: "One governed AI assistant per department.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      // Dark is the default theme; the script below drops it for a saved
      // light preference before first paint.
      className={cn("dark h-full", geistSans.variable, geistMono.variable, "font-sans")}
    >
      <body className="min-h-full">
        <Script id="theme" strategy="beforeInteractive">
          {"try{if(localStorage.getItem('theme')==='light'){document.documentElement.classList.remove('dark')}}catch(e){}"}
        </Script>
        <a
          href="#main"
          className="sr-only rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
        >
          Skip to main content
        </a>
        <ThemeSync />
        <TooltipProvider>
          <AppShell>{children}</AppShell>
        </TooltipProvider>
      </body>
    </html>
  );
}
