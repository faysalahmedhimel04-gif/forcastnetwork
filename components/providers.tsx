"use client";

import { type ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base, mainnet, polygon, sepolia, baseSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

// Create wagmi config using ConnectKit's helper (excellent defaults for MetaMask + WalletConnect)
const config = createConfig(
  getDefaultConfig({
    // Supported chains - prioritize L2s good for prediction markets (low fees)
    chains: [base, polygon, mainnet, sepolia, baseSepolia],
    transports: {
      [base.id]: http(),
      [polygon.id]: http(),
      [mainnet.id]: http(),
      [sepolia.id]: http(),
      [baseSepolia.id]: http(),
    },

    // WalletConnect v2 Project ID (get free at https://cloud.walletconnect.com)
    // Falls back gracefully for localhost / injected wallets (MetaMask direct)
    walletConnectProjectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",

    // dApp metadata shown in wallet connection screens
    appName: "ForcastNetwork",
    appDescription:
      "Prediction markets for FIFA World Cup 2026. Trade Yes/No shares on matches, winner, Golden Boot and more.",
    appUrl: "https://forcastnetwork.com",
    appIcon: "/favicon.ico",
  })
);

// React Query client (required by wagmi v2+)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export function Web3Providers({ children }: ProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          // "auto" respects our next-themes dark/light
          // You can also use "midnight", "soft", or pass a full custom theme object
          theme="auto"
          options={{
            // Prefer Base for future on-chain markets (cheap + fast finality)
            initialChainId: base.id,
            // Hide the "Powered by WalletConnect" branding if desired
            hideBalance: false,
            hideTooltips: false,
            // Enforce a nice UX
            enforceSupportedChains: false,
          }}
          customTheme={{
            "--ck-connectbutton-background": "hsl(var(--accent))",
            "--ck-connectbutton-color": "white",
            "--ck-connectbutton-hover-background": "hsl(var(--accent) / 0.9)",
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
