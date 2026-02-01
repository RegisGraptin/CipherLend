"use client";

import * as React from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiAdapter } from "../../lib/wagmi";
import { WagmiProvider, type Config } from 'wagmi'

// Import the modal to initialize it
import '../../lib/appkit'

export const client = new QueryClient();

export function WalletProvider({ children }: { children: React.ReactNode }) {

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
