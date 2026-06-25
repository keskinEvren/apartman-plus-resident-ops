import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter, Outfit, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "komşu.site — Apartman Sakin Portalı",
    template: "%s | komşu.site",
  },
  description:
    "Kargo takibi, tesis rezervasyonu, ziyaretçi yönetimi ve destek talepleri. Apartman sakinlerinin günlük ihtiyaçlarını çözen production-grade B2B SaaS platformu.",
  metadataBase: new URL("https://www.komsu.site"),
  openGraph: {
    title: "komşu.site — Apartman Sakin Portalı",
    description:
      "Kargo takibi, tesis rezervasyonu, ziyaretçi yönetimi ve destek talepleri. Production-grade multi-tenant B2B SaaS.",
    url: "https://www.komsu.site",
    siteName: "komşu.site",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "komşu.site — Apartman Sakin Portalı",
    description:
      "Kargo takibi, tesis rezervasyonu, ziyaretçi yönetimi ve destek talepleri. Production-grade B2B SaaS.",
  },
  icons: {
    icon: "/favicon.svg",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#1e1145",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${outfit.variable} ${plusJakarta.variable}`}
      suppressHydrationWarning
    >
      <body className="font-body" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
