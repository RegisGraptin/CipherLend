"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, CircleDollarSign, CheckCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useConnection, usePublicClient, useWriteContract } from "wagmi";
import { parseUnits, erc20Abi } from "viem";
import { PROTOCOL } from "@/lib/protocol";
import { useUSDCBalance } from "@/lib/hooks/useTokenBalance";
import { useConfidentialBalance } from "@/lib/hooks/useConfidentialBalance";
import { useFHEDecrypt, useFhevm } from "@/lib/fhevm-sdk/react";
import { ethers } from "ethers";
import { formatUnits } from "viem";
import { formatAmount } from "@/lib/utils";
import { GenericStringInMemoryStorage } from "@/lib/fhevm-sdk/storage/GenericStringStorage";

export function ShieldingBridge() {
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [swapAmountRaw, setSwapAmountRaw] = useState("");
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  const [revealEncrypted, setRevealEncrypted] = useState(false);
  const [shieldStage, setShieldStage] = useState<"idle" | "approving" | "wrapping" | "done">("idle");
  const { address: userAddress } = useConnection();
  const publicClient = usePublicClient();
  const { mutateAsync } = useWriteContract();
  const [cUsdcDecrypted, setCUsdcDecrypted] = useState<string>("");
  const encryptedPlaceholder = "✶✶✶✶✶✶✶✶";
  
  const { formattedAmount: usdcFormattedAmount, data: usdcRaw } = useUSDCBalance(userAddress);
  const { data: cUsdcEncrypted, refetch: refetchConfidentialBalance } = useConfidentialBalance(userAddress as any);

  const { instance: fhevm, status: fheStatus, error } = useFhevm({
    provider: typeof window !== "undefined" ? (window as any).ethereum : undefined,
    chainId: PROTOCOL.chainId,
  });

  const [signer, setSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const storage = new GenericStringInMemoryStorage();

  // Initialize ethers signer from the injected provider
  if (typeof window !== "undefined" && !signer && (window as any).ethereum) {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    provider.getSigner().then(setSigner).catch(() => {});
  }

  const requests = cUsdcEncrypted
    ? [{ handle: cUsdcEncrypted as string, contractAddress: PROTOCOL.address.cUSDC }]
    : [];

  const { decrypt, isDecrypting, results } = useFHEDecrypt({
    instance: fhevm,
    ethersSigner: signer,
    fhevmDecryptionSignatureStorage: storage,
    chainId: PROTOCOL.chainId,
    requests,
  });

  const handleDecrypt = async () => {
    decrypt();
  };

  useEffect(() => {
    if (!cUsdcEncrypted) return;
    const raw = (results as Record<string, unknown>)[cUsdcEncrypted as string];
    if (raw !== undefined) {
      if (typeof raw === "bigint") {
        const base = formatUnits(raw, PROTOCOL.decimals.cUSDC);
        setCUsdcDecrypted(formatAmount(base));
      } else if (typeof raw === "string") {
        setCUsdcDecrypted(raw);
      } else if (raw !== null) {
        setCUsdcDecrypted(String(raw));
      }
      setRevealEncrypted(true);
    }
  }, [results, cUsdcEncrypted]);


  const handleShield = async () => {
    try {
      if (!userAddress) return;
      let amountStr = swapAmountRaw.trim();
      if (amountStr.endsWith(".")) amountStr = amountStr.slice(0, -1);
      if (!amountStr || Number(amountStr) <= 0) return;

      setPrivacyLoading(true);
      setShieldStage("approving");
      const amount = parseUnits(amountStr, PROTOCOL.decimals.USDC);

      const approveHash = await mutateAsync({
        address: PROTOCOL.address.USDC,
        abi: erc20Abi,
        functionName: "approve",
        args: [PROTOCOL.address.cUSDC, amount]
      });
      await publicClient!.waitForTransactionReceipt({ hash: approveHash });

      setShieldStage("wrapping");
      const wrapHash = await mutateAsync({
        address: PROTOCOL.address.cUSDC,
        abi: PROTOCOL.abi.cUSDC as any,
        functionName: "wrap",
        args: [userAddress, amount]
      });
      await publicClient!.waitForTransactionReceipt({ hash: wrapHash });

      // Refresh encrypted cUSDC balance and reset decrypted view
      await refetchConfidentialBalance();
      setRevealEncrypted(false);
      setCUsdcDecrypted("");
      setShieldStage("done");

      setSwapAmountRaw("");
    } catch (err) {
      console.error("Shield failed:", err);
    } finally {
      setPrivacyLoading(false);
    }
  };

  const normalizeAmountInput = (v: string) => {
    const decimals = PROTOCOL.decimals.USDC ?? 6;
    let s = v.replace(/,/g, "").replace(/[^\d.]/g, "");
    const parts = s.split(".");
    const intPart = (parts[0] || "").replace(/^0+(?=\d)/, "");
    let fracPart = parts[1] || "";
    if (fracPart.length > decimals) fracPart = fracPart.slice(0, decimals);
    if (parts.length > 1) return `${intPart || "0"}.${fracPart}`;
    return intPart;
  };

  const prettyAmount = (raw: string) => {
    if (!raw) return "";
    const [i, f] = raw.split(".");
    const intNum = Number(i || "0");
    const intFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
      Number.isFinite(intNum) ? intNum : 0
    );
    return f !== undefined ? `${intFmt}.${f}` : intFmt;
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>Shield Assets</CardTitle>
          <CardDescription>
            Shield USDC into cUSDC for confidential transfers using FHE.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Amount to Shield
            </p>
            <div
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-sm text-zinc-300 cursor-text"
              onClick={() => amountInputRef.current?.focus()}
            >
              <div className="flex flex-1 items-center gap-3 min-w-0">
                <img src="/usdc.svg" alt="USDC" className="h-5 w-5" />
                <Input
                  placeholder="0.00"
                  value={prettyAmount(swapAmountRaw)}
                  onChange={(event) => {
                    setShieldStage("idle");
                    setSwapAmountRaw(normalizeAmountInput(event.target.value));
                  }}
                  inputMode="decimal"
                  ref={amountInputRef}
                  aria-label="Amount to shield"
                  className="h-auto w-full flex-1 min-w-0 border-none bg-transparent p-0 text-2xl font-mono text-white shadow-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge className="border-[#2775CA]/40 bg-[#2775CA]/10 text-[#2775CA]">USDC</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const base = usdcRaw ? formatUnits(usdcRaw as bigint, PROTOCOL.decimals.USDC) : "";
                    setSwapAmountRaw(base);
                  }}
                >
                  Max
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-sm text-zinc-300">
            <span className="text-zinc-400">You will receive</span>
            <span className="text-2xl font-mono text-[#00FF94]">{formatAmount(swapAmountRaw || "0")} cUSDC</span>
          </div>
          <div className="rounded-2xl border border-[#00FF94]/20 bg-[#00FF94]/5 p-4 text-sm text-zinc-300">
            <p className="flex items-center gap-2 text-[#00FF94]">
              <Shield className="h-4 w-4" />
              Shielding Progress
            </p>
            <div className="mt-3 space-y-2">
              {[
                { key: "approving", label: "Approve USDC", icon: <CircleDollarSign className="h-4 w-4" /> },
                { key: "wrapping", label: "Wrap to cUSDC", icon: <Shield className="h-4 w-4" /> },
              ].map((step) => {
                const currentOrder = { idle: -1, approving: 0, wrapping: 1, done: 2 } as const;
                const statusOrder = currentOrder[shieldStage];
                const stepOrder = currentOrder[step.key as keyof typeof currentOrder];
                const isDone = statusOrder > stepOrder;
                const isActive = statusOrder === stepOrder && privacyLoading;
                return (
                  <div key={step.key} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                    <div className="flex items-center gap-2">
                      {step.icon}
                      <span>{step.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isDone ? (
                        <CheckCircle className="h-4 w-4 text-[#00FF94]" />
                      ) : isActive ? (
                        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                      ) : (
                        <span className="text-xs text-zinc-500">Pending</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-end">
          <Button onClick={handleShield} disabled={!swapAmountRaw || !userAddress || privacyLoading}>
            {privacyLoading ? "Shielding..." : "Shield USDC"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Balances</CardTitle>
          <CardDescription>
            Public USDC vs encrypted cUSDC inside privacy vaults.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-zinc-500">
              <img src="/usdc.svg" alt="USDC" className="h-5 w-5" />
              USDC Balance
            </p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-3xl font-mono font-semibold text-white">{usdcFormattedAmount || "0.0"}</p>
              <Badge className="border-[#2775CA]/40 bg-[#2775CA]/10 text-[#2775CA]">USDC</Badge>
            </div>
          </div>

          <div className="relative rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-zinc-500">
              <Lock className="h-4 w-4" />
              Encrypted cUSDC
            </p>
            <div className="mt-2 flex items-center justify-between">
              <div className="relative overflow-hidden rounded-xl">
                <motion.p
                  className="relative z-10 font-mono text-3xl font-semibold text-[#00FF94]"
                  animate={{ filter: revealEncrypted ? "blur(0px)" : "blur(8px)", opacity: revealEncrypted ? 1 : 0.8 }}
                  transition={{ duration: 0.4 }}
                >
                  {revealEncrypted ? cUsdcDecrypted : encryptedPlaceholder}
                </motion.p>
                {!revealEncrypted && (
                  <motion.div
                    className="absolute inset-0"
                    animate={{ opacity: [0.24, 0.36, 0.28, 0.4, 0.3] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 20% 20%, rgba(0,255,148,0.08), transparent 35%), radial-gradient(circle at 80% 60%, rgba(0,255,148,0.06), transparent 45%), repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 2px, transparent 2px, transparent 4px)",
                    }}
                  />
                )}
              </div>
              <Badge>cUSDC</Badge>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                {revealEncrypted ? "Decrypted" : "Encrypted • Privacy Mask Active"}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-end gap-4">
          {!revealEncrypted && (
            <Button variant="outline" onClick={handleDecrypt} disabled={isDecrypting || !cUsdcEncrypted || fheStatus !== "ready"}>
              <Lock className="h-4 w-4" />
              {isDecrypting ? "Revealing..." : "Reveal Balance"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
