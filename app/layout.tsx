import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { Navbar } from "@/components/navbar";

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
    default: "ForcastNetwork | Forecast Creator Network",
    template: "%s | ForcastNetwork",
  },
  description: "The professional network for forecasters and analysts. Create, share, and track the accuracy of your predictions. No betting. No markets. Just expert forecasting.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "ForcastNetwork | Forecast Creator Network",
    description: "Publish time-bound predictions, build a public accuracy track record, and follow top analysts. Pure forecasting — no betting or trading.",
    // Add a public/og-image.png (1200x630 recommended) for social sharing
    // images: [{ url: "/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ForcastNetwork",
    description: "Expert forecasting platform. Track accuracy. No markets, no betting.",
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
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <main className="flex-1">{children}</main>
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
