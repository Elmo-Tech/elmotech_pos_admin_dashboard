import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { directionFor } from "@/i18n/messages";
import { getLocale } from "@/server/i18n/get-locale";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "إدارة تراخيص Elmo POS",
  description: "لوحة إدارة داخلية لعمليات تراخيص Elmo POS.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      dir={directionFor(locale)}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
