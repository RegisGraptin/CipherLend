"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

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

export function ShieldingBridge() {
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [swapAmount, setSwapAmount] = useState("");

  const handleSwap = () => {
    if (!swapAmount) return;
    setPrivacyLoading(true);
    setTimeout(() => {
      setPrivacyLoading(false);
      setSwapAmount("");
    }, 2200);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>The Shielding Bridge</CardTitle>
          <CardDescription>
            Wrap public tokens into FHE-encrypted cTokens for private operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Public Token Amount
            </p>
            <Input
              placeholder="Enter amount to shield"
              value={swapAmount}
              onChange={(event) => setSwapAmount(event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-300">
            <span>Output</span>
            <span className="text-[#00FF94]">{swapAmount || "0.0"} cTokens</span>
          </div>
          <div className="rounded-2xl border border-[#00FF94]/20 bg-[#00FF94]/5 p-4 text-sm text-zinc-300">
            <p className="flex items-center gap-2 text-[#00FF94]">
              <Shield className="h-4 w-4" />
              Privacy Loading Channel
            </p>
            <div className="mt-3 flex items-center gap-3">
              {[0, 1, 2].map((dot) => (
                <motion.span
                  key={dot}
                  className="h-2 w-2 rounded-full bg-[#00FF94]"
                  animate={{
                    opacity: privacyLoading ? [0.2, 1, 0.2] : 0.3,
                    scale: privacyLoading ? [0.9, 1.2, 0.9] : 1,
                  }}
                  transition={{
                    duration: 0.9,
                    repeat: privacyLoading ? Infinity : 0,
                    delay: dot * 0.2,
                  }}
                />
              ))}
              <span className="text-xs text-zinc-400">
                {privacyLoading ? "Privacy Loading..." : "Idle"}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-4">
          <Button variant="outline">View Bridge Params</Button>
          <Button onClick={handleSwap}>
            {privacyLoading ? "Shielding" : "Swap to cTokens"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zero-Knowledge Transport</CardTitle>
          <CardDescription>
            Batch routing through encrypted relays to mask liquidity origin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Active Relays
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">7</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Obfuscation Layer
            </p>
            <p className="mt-2 text-sm text-zinc-300">
              Noise entropy synced across 42 validator shards.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
