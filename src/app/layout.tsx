import type { Metadata, Viewport } from "next";
import { Inter, Saira_Condensed } from "next/font/google";
import { RegisterSW } from "@/components/RegisterSW";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const saira = Saira_Condensed({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Bolão Copa 2026",
  description: "Bolão da Copa do Mundo 2026 entre amigos",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Bolão 2026",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A1228",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${saira.variable}`}>
      <body className="font-sans antialiased">
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
