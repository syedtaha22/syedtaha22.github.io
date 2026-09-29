import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import TerrainBackground from "@/components/TerrainBackground";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://syedtaha22.github.io"),
  authors: [{ name: "Syed Taha" }],
  icons: {
    icon: [
      { url: "/favicons/favicon-32x32.webp", sizes: "32x32", type: "image/png" },
      { url: "/favicons/favicon-16x16.webp", sizes: "16x16", type: "image/png" },
    ],
    apple: "/favicons/apple-touch-icon.webp",
  },
};

// Runs before first paint so there is no flash of the wrong theme.
const THEME_SCRIPT = `(function () {
  try {
    var pref = localStorage.getItem("theme-preference") || "system";
    var dark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  } catch (e) {}
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Root layout wraps every page, so this loads site-wide. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <TerrainBackground />
        <Navbar />
        {children}
        <Footer />
        <ThemeSwitcher />
      </body>
    </html>
  );
}
