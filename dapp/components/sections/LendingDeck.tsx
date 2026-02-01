"use client";

import { useEffect, useMemo, useState } from "react";
import { Zap } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";

const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$@%";

const generateRandomString = (length: number) =>
  Array.from({ length })
    .map(() => randomChars[Math.floor(Math.random() * randomChars.length)])
    .join("");

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

export function LendingDeck() {
  const [roundSeconds, setRoundSeconds] = useState(11 * 60 + 21);
  const [mode, setMode] = useState<"supply" | "withdraw">("supply");
  const [commitValue, setCommitValue] = useState("");
  const [encryptedValue, setEncryptedValue] = useState("-");
  const [encrypting, setEncrypting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRoundSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const roundStatus = useMemo(() => {
    return roundSeconds === 0 ? "Rolling new round..." : "Round #42";
  }, [roundSeconds]);

  const handleCommit = () => {
    if (!commitValue) return;
    setEncrypting(true);
    let ticks = 0;
    const targetLength = Math.max(commitValue.length, 6);
    const interval = setInterval(() => {
      ticks += 1;
      setEncryptedValue(generateRandomString(targetLength));
      if (ticks > 16) {
        clearInterval(interval);
        setEncryptedValue(generateRandomString(targetLength));
        setEncrypting(false);
      }
    }, 70);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
      <Card>
        <CardHeader>
          <CardTitle>Lending Command Deck</CardTitle>
          <CardDescription>
            Launch shielded lending intents inside the current privacy round.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                Current Round
              </p>
              <p className="text-2xl font-semibold text-white">{roundStatus}</p>
            </div>
            <div className="rounded-2xl border border-[#00FF94]/25 bg-[#00FF94]/10 px-4 py-2 text-sm text-[#00FF94]">
              Countdown {formatTime(roundSeconds)}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                Supply / Withdraw
              </p>
              <p className="text-sm text-zinc-300">
                Mode: {mode === "supply" ? "Supplying" : "Withdrawing"}
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className={mode === "supply" ? "text-[#00FF94]" : "text-zinc-500"}>
                Supply
              </span>
              <Switch
                checked={mode === "withdraw"}
                onCheckedChange={(checked) => setMode(checked ? "withdraw" : "supply")}
              />
              <span className={mode === "withdraw" ? "text-[#00FF94]" : "text-zinc-500"}>
                Withdraw
              </span>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Batch Status</p>
              <div className="mt-3 space-y-2 text-sm text-zinc-300">
                <p>Encrypted Commits: 14</p>
                <p>
                  Total Round TVL: <span className="text-[#00FF94]">[REDACTED]</span>
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Encrypted Signal</p>
              <p className="mt-3 font-mono text-lg text-[#00FF94]">{encryptedValue}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {encrypting ? "FHE morphing in progress" : "Awaiting commit"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Commit Value</p>
            <Input
              placeholder="Amount for encrypted batch"
              value={commitValue}
              onChange={(event) => setCommitValue(event.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-4">
          <Button variant="ghost">Simulate Route</Button>
          <Button onClick={handleCommit}>
            <Zap className="h-4 w-4" />
            Commit
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Encrypted Telemetry</CardTitle>
          <CardDescription>
            Your intent stays encrypted until the round closes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Sync Latency</p>
            <p className="mt-2 text-3xl font-semibold text-white">0.82s</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Attestation</p>
            <p className="mt-2 text-sm text-zinc-300">Commitment hashed into round ledger.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
