import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#030712", // bg-gray-950
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Previne o zoom no mobile ao focar em inputs (embora já seja tratado pelo tailwind ou css)
};

export const metadata: Metadata = {
  metadataBase: new URL('https://descomplica-financiamento.vercel.app'),
  title: {
    default: "FinanSim — Simulador Avançado de Financiamento Imobiliário",
    template: "%s | FinanSim"
  },
  description: "Descubra como quitar seu financiamento Caixa mais rápido. Compare SAC vs Price, simule o impacto de amortizações extras, FGTS e benefícios CLT para economizar em juros.",
  keywords: ["simulador de financiamento", "amortização caixa", "sac ou price", "fgts financiamento", "calculadora financiamento imobiliário", "quitar apartamento", "financiamento habitacional"],
  authors: [{ name: "Vitor Hugo", url: "mailto:vitorhugoss17@gmail.com" }],
  creator: "Vitor Hugo",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://descomplica-financiamento.vercel.app",
    title: "FinanSim — Simulador Avançado de Financiamento Imobiliário",
    description: "Compare SAC e Price, simule aportes extras e descubra quanto você pode economizar no seu financiamento imobiliário.",
    siteName: "FinanSim"
  },
  twitter: {
    card: "summary_large_image",
    title: "FinanSim — Simulador Avançado de Financiamento Imobiliário",
    description: "Descubra como quitar seu financiamento mais rápido economizando milhares de reais em juros.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-gray-950">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
