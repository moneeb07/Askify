import type { Metadata } from "next";
import { DM_Sans, DM_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/hooks/context/ThemeContext";
import { Toaster } from "@/components/ui/toaster";
import AppHeader from "@/components/AppHeader";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Askify — Intelligent Document Conversations",
  description:
    "Upload documents and have intelligent, agentic conversations with them. Powered by AI that autonomously searches, summarizes, and reasons across your files.",
};

/**
 * Inline script that runs before React hydrates.
 * Reads the stored theme from localStorage and applies it to <html>
 * to prevent a flash of incorrect theme.
 */
const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('app-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.classList.add(t);
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        dmSans.variable,
        dmMono.variable,
        geist.variable,
        "font-sans"
      )}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <ThemeProvider>
          <AppHeader />
          <main className="flex flex-1 flex-col min-h-0">{children}</main>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}