import { Address, erc20Abi, formatUnits } from "viem";
import { useReadContract } from "wagmi";
import { PROTOCOL } from "../protocol";
import { formatAmount } from "../utils";

export function useUSDCBalance(
  userAddress: Address | undefined
) {
  const result = useReadContract({
    address: PROTOCOL.address.USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [userAddress!],
    query: {
      enabled: !!userAddress,
      refetchInterval: 5000, // 5 seconds
    },
  });

  const raw = result.data as bigint | undefined
  const base = raw ? formatUnits(raw, PROTOCOL.decimals.USDC) : undefined
  const formattedAmount = base ? formatAmount(base, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : undefined

  return {
     ...result,
    formattedAmount,
  }
}
