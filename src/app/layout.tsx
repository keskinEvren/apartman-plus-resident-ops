import "./globals.css";
import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Apartman Plus Resident Ops",
  description: "Akıllı site yönetimi ve sakin operasyonları platformu",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      className={`dark ${inter.variable} ${outfit.variable}`}
      suppressHydrationWarning
    >
      <body className="font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
