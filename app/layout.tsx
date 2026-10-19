import type { Metadata } from "next";
import "./globals.css";
import "./niches/cosmetics/cosmetics.css";
import ErrorBoundary from "./lib/ErrorBoundary";

export const metadata: Metadata = {
  title: "Aura Beverly Hills | Discreet Deep-Plane Facial Architecture",
  description:
    "Private cosmetic surgery in Beverly Hills. Deep-plane facial architecture, Quad-A surgical theater, and 100% anonymous VIP suites.",
  applicationName: "Aura Beverly Hills",
};

const THEME = "#FAF8F5";
const INK = "#141316";

const criticalCss = `html,body,#cosmetics-root{background-color:${THEME}!important;color:${INK};margin:0}html{overflow-x:hidden}body{min-height:100%;font-family:Montserrat,system-ui,sans-serif}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning style={{ backgroundColor: THEME, color: INK }}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: criticalCss }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Montserrat:wght@400;600;700&display=swap"
        />
        <link rel="preload" as="image" href="/niches/cosmetics/before-poster.jpg" />
        <link rel="preload" as="image" href="/niches/cosmetics/after-poster.jpg" />
        <link rel="preload" as="video" href="/niches/cosmetics/cosmetic-befor-loop.mp4" type="video/mp4" />
      </head>
      <body
        className="font-sans antialiased"
        suppressHydrationWarning
        style={{ backgroundColor: THEME, color: INK, margin: 0 }}
      >
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
