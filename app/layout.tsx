import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingActionHub } from "@/components/FloatingActionHub";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { Toaster } from "sonner";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3089"),
  title: "DealFlow.ai — Autonomous AI Sales & Business Workforce",
  description:
    "DealFlow.ai is an autonomous AI workforce that doesn't just recommend what your business should do — it actually does the work. From objective intake to finding prospects, joining sales calls, closing deals, and executing requirements end-to-end.",
  openGraph: {
    title: "DealFlow.ai — Autonomous AI Sales & Business Workforce",
    description: "DealFlow.ai is an autonomous AI workforce that doesn't just recommend what your business should do — it actually does the work. From objective intake to closing deals and executing requirements end-to-end.",
    type: "website",
    locale: "en_US",
    siteName: "DealFlow.ai",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "DealFlow.ai Autonomous AI Sales & Business Workforce",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DealFlow.ai — Autonomous AI Sales & Business Workforce",
    description: "DealFlow.ai is an autonomous AI workforce that doesn't just recommend what your business should do — it actually does the work. From objective intake to closing deals and executing requirements end-to-end.",
    images: ["/opengraph-image.png"],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${serif.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('df_theme');
                  var supportDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                    document.documentElement.setAttribute('data-theme', 'light');
                  } else {
                    document.documentElement.classList.remove('light');
                    document.documentElement.classList.add('dark');
                    document.documentElement.setAttribute('data-theme', 'dark');
                  }
                  
                  var bannerDismissed = localStorage.getItem('df_banner_dismissed');
                  if (bannerDismissed === 'true') {
                    document.documentElement.setAttribute('data-banner-dismissed', 'true');
                  }
                } catch (e) {}

                // Automatically handle Next.js ChunkLoadErrors by reloading the page to fetch the correct chunks
                try {
                  window.addEventListener('error', function(e) {
                    var target = e.target || e.srcElement;
                    var isScript = target && target.nodeName === 'SCRIPT';
                    if (isScript && target.src && target.src.indexOf('/_next/static/') !== -1) {
                      console.warn('Next.js script chunk failed to load. Reloading page...');
                      window.location.reload();
                    }
                  }, true);

                  window.addEventListener('unhandledrejection', function(e) {
                    if (e.reason && (e.reason.name === 'ChunkLoadError' || (e.reason.message && e.reason.message.indexOf('ChunkLoadError') !== -1))) {
                      console.warn('Unhandled ChunkLoadError detected. Reloading page...');
                      window.location.reload();
                    }
                  });
                } catch (e) {}
              })();
            `
          }}
        />
        {/* Preconnect for Calendly only since that's what we use */}
      <link rel="preconnect" href="https://calendly.com" />
      <link rel="dns-prefetch" href="https://calendly.com" />
      </head>
      <body
        className={`${sans.variable} min-h-screen bg-background font-sans text-foreground antialiased flex flex-col`}
        suppressHydrationWarning
      >
        <Header />
        <main className="flex-1">
          <div id="main-content">
            {children}
          </div>
        </main>
        <Footer />
        <FloatingActionHub />
        <CookieConsentBanner />
        {/* Sonner toast notifications — app-wide */}
        <Toaster
          position="bottom-right"
          theme="dark"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "hsl(220 42% 7%)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "hsl(0 0% 98%)",
            },
          }}
        />
      </body>
    </html>
  );
}
