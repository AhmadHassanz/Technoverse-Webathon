import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/frontend/components/providers";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const THEME_SCRIPT = `try{var p=JSON.parse(localStorage.getItem("examcore:prefs")||"null");if(p){var d=document.documentElement;if(p.theme)d.dataset.theme=p.theme;if(p.fontScale)d.dataset.font=p.fontScale;}}catch(e){}`;

export const viewport: Viewport = {
  themeColor: "#0b0f1e",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "ExamCore — Secure Examinations",
  description:
    "Create, take and assess secure online examinations with clarity, integrity and control.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="light"
      data-font="md"
      className={`${geist.variable} ${bricolage.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Apply the last-used theme before the first paint (avoids a flash of the wrong theme). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full bg-parchment text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
