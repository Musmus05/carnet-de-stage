import type { Metadata } from "next";
import { Hanken_Grotesk, Source_Serif_4 } from "next/font/google";
import { getDictionary } from "@/lib/i18n/server";
import "./globals.css";

const ui = Hanken_Grotesk({
  variable: "--font-ui",
  subsets: ["latin"],
});

const label = Source_Serif_4({
  variable: "--font-label",
  subsets: ["latin"],
  axes: ["opsz"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return {
    title: { default: t.meta.title, template: `%s · ${t.meta.title}` },
    description: t.meta.description,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale } = await getDictionary();
  return (
    <html lang={locale} className={`${ui.variable} ${label.variable} h-full antialiased`}>
      <head>
        {/* Declared here rather than through app/icon.svg: the metadata icon
            tag was re-inserted on every navigation and the tab icon blinked. */}
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
