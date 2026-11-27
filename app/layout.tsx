import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";
import { Providers } from "@/frontend/components/providers";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const THEME_SCRIPT = `try{var p=JSON.parse(localStorage.getItem("examcore:prefs")||"null");if(p){var d=document.documentElement;if(p.theme)d.dataset.theme=p.theme;if(p.fontScale)d.dataset.font=p.fontScale;}}catch(e){}`;

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
      className={`${dmSans.variable} ${instrumentSerif.variable} ${plexMono.variable} h-full antialiased`}
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
