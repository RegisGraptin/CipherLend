"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useConnection, useReadContract } from "wagmi";
import { Address, erc20Abi, formatUnits } from "viem";
import { PROTOCOL } from "@/lib/protocol";
import { formatAmount } from "@/lib/utils";
import AaveAdapter from "@/lib/abis/AaveAdapter.json" assert { type: "json" };
import { useBalance } from "@/lib/hooks/useTokenBalance";

export function PrivatePortfolio() {
  const [revealBalance, setRevealBalance] = useState(false);

  // Public USDC wallet balance (user)
  const { formattedAmount: usdcFormatted } = useBalance(PROTOCOL.address.USDC, PROTOCOL.address.ConfidentialLending);

  // Fetch aUSDC token address from AAVE for underlying USDC via adapter
  const { data: aTokenAddress } = useReadContract({
    address: AaveAdapter.address as Address,
    abi: AaveAdapter.abi as any,
    functionName: "fetchAssets",
    args: [PROTOCOL.address.AAVEPool, PROTOCOL.address.USDC],
    query: { enabled: !!PROTOCOL.address.AAVEPool && !!PROTOCOL.address.USDC },
  });

  // Protocol-held aUSDC balance (ConfidentialLending supplies on-chain)
  const { data: aUSDCBalanceRaw } = useReadContract({
    address: (aTokenAddress || "0x0000000000000000000000000000000000000000") as Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [PROTOCOL.address.ConfidentialLending],
    query: { enabled: !!aTokenAddress },
  });

  const aUSDCBase = aUSDCBalanceRaw ? formatUnits(aUSDCBalanceRaw as bigint, PROTOCOL.decimals.USDC) : undefined;
  const aUSDCFormatted = aUSDCBase ? formatAmount(aUSDCBase, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : undefined;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>Private Portfolio</CardTitle>
          <CardDescription>
            View-key secured balances routed through FHE shields.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">View Key</p>
            <p className="mt-2 font-mono text-sm text-zinc-300">
              {revealBalance ? "VK-7X9A-0D4F-52E9" : "•••• •••• •••• ••••"}
            </p>
          </div>

          <div className="rounded-3xl border border-[#00FF94]/25 bg-[#00FF94]/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Private Interest Earned (Aave)
            </p>
            <motion.div
              className="mt-4 text-4xl font-semibold text-white"
              animate={{
                filter: revealBalance ? "blur(0px)" : "blur(10px)",
                opacity: revealBalance ? 1 : 0.6,
              }}
              transition={{ duration: 0.5 }}
            >
              Ξ 0.7421
            </motion.div>
            <p className="mt-3 text-sm text-zinc-400">
              Shielded yield streamed through privacy vaults.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-4">
          <Button variant="ghost">Rotate View Key</Button>
          <Button onClick={() => setRevealBalance((prev) => !prev)}>
            <Lock className="h-4 w-4" />
            {revealBalance ? "Hide Balance" : "Reveal My Balance"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Underlying Balances</CardTitle>
          <CardDescription>Wallet USDC and Aave supply (aUSDC).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">USDC (Wallet)</p>
            <p className="mt-2 text-2xl font-semibold text-white font-mono">
              {usdcFormatted ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">aUSDC (Supplied via Protocol)</p>
            <p className="mt-2 text-2xl font-semibold text-white font-mono">
              {aUSDCFormatted ?? (aTokenAddress ? "—" : "Resolving aUSDC...")}
            </p>
            <p className="mt-2 text-xs text-zinc-500">Source: AAVE Pool on {PROTOCOL.chainId}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
