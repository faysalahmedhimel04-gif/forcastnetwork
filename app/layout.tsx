import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { Navbar } from "@/components/navbar";
import { Web3Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "ForcastNetwork | FIFA World Cup 2026 Prediction Markets",
    template: "%s | ForcastNetwork",
  },
  description: "Trade Yes/No shares on FIFA World Cup 2026 matches, tournament winner, Golden Boot, and more. Polymarket-style prediction markets powered by crypto wallets. Fake USDC to start — real on-chain coming soon on Base & Polygon.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "ForcastNetwork | FIFA World Cup 2026 Prediction Markets",
    description: "The premier prediction market for the 2026 FIFA World Cup. Buy and sell event shares with crypto. Live odds, portfolio tracking, and on-chain settlement coming soon.",
    // Add a public/og-image.png (1200x630 recommended) for social sharing
    // images: [{ url: "/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ForcastNetwork — WC2026 Prediction Markets",
    description: "Yes/No share trading for every World Cup match and market. Connect wallet to trade.",
  },
  metadataBase: new URL("https://forcastnetwork.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Web3Providers>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Toaster position="top-center" richColors closeButton />
          </Web3Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
