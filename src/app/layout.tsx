import type { Metadata } from "next";
import { Calistoga, IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from "next/font/google";
import { directionFor } from "@/shared/i18n";
import { getLocale } from "@/shared/i18n/server";
import { getServerEnvironment } from "@/shared/config/server";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const displayFont = Calistoga({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "إدارة تراخيص Elmo POS",
  description: "لوحة إدارة داخلية لعمليات تراخيص Elmo POS.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Validate the runtime/environment/project relationship for every route,
  // including public routes, before any Supabase client can be created.
  getServerEnvironment();
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      dir={directionFor(locale)}
      className={`${plexSans.variable} ${plexArabic.variable} ${plexMono.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
