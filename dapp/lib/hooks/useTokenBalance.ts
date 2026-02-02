import { Address, erc20Abi, formatUnits } from "viem";
import { useReadContract } from "wagmi";
import { PROTOCOL } from "../protocol";
import { formatAmount } from "../utils";

export function useBalance(
  contractAddress: Address | undefined,
  userAddress: Address | undefined
) {
  const result = useReadContract({
    address: contractAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [userAddress!],
    query: {
      enabled: !!userAddress && !!contractAddress,
      refetchInterval: 5000, // 5 seconds
    },
  });

  const raw = result.data as bigint | undefined
  const base = raw ? formatUnits(raw, PROTOCOL.decimals.USDC) : undefined // FIXME: hardcoded decimals not good here
  const formattedAmount = base ? formatAmount(base, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : undefined

  return {
     ...result,
    formattedAmount,
  }
}


export function useATokenAddress() {
  return useReadContract({
    address: PROTOCOL.address.ConfidentialLending,
    abi: PROTOCOL.abi.ConfidentialLending,
    functionName: "aAsset",
  });
}