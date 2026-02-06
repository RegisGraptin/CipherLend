import { useBalance } from "@/lib/hooks/useTokenBalance";
import { Badge } from "lucide-react";
import { useConnection } from "wagmi";

export function ClearBalance({tokenName, tokenAddress}: {tokenName: string, tokenAddress: `0x${string}`}) {
  const { address: userAddress } = useConnection();
  const { formattedAmount: usdcFormattedAmount } = useBalance(
    tokenAddress,
    userAddress,
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-zinc-500">
        <img
          src={`/${tokenName.toLowerCase()}.svg`}
          alt={tokenName}
          className="h-5 w-5"
        />
        {tokenName} Balance
      </p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-3xl font-mono font-semibold text-white">
          {usdcFormattedAmount || "0.0"}
        </p>
        <Badge className="border-[#2775CA]/40 bg-[#2775CA]/10 text-[#2775CA]">
          {tokenName}
        </Badge>
      </div>
    </div>
  );
}
