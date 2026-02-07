import { useReadContract } from "wagmi";
import { PROTOCOL } from "@/lib/protocol";
import { parseUnits, zeroAddress } from "viem";
import V4QuoterAbi from "@/lib/abis/V4Quoter.json" assert { type: "json" };

export function useSwapQuote(
  amountIn: string, // The input amount as a string (e.g., "100")
  tokenInAddress: `0x${string}`,
  tokenOutAddress: `0x${string}`,
  quoterAddress: `0x${string}`,
  inputDecimals: number, // Decimals of the input token
  outputDecimals: number // Decimals of the output token
) {
  const decimals = inputDecimals;

  // Determine swap direction based on token ordering
  // In Uniswap V4, currency0 must be < currency1
  const zeroForOne = BigInt(tokenInAddress) < BigInt(tokenOutAddress);
  const currency0 = zeroForOne ? tokenInAddress : tokenOutAddress;
  const currency1 = zeroForOne ? tokenOutAddress : tokenInAddress;

  // Parse the input amount
  let parsedAmount: bigint;
  try {
    parsedAmount =
      amountIn && Number(amountIn) > 0
        ? parseUnits(amountIn, decimals)
        : BigInt(0);
  } catch {
    parsedAmount = BigInt(0);
  }

  // Construct the PoolKey matching your contract's configuration
  const poolKey = {
    currency0,
    currency1,
    fee: 3000, // 0.3% fee tier
    tickSpacing: 60,
    hooks: zeroAddress, // No hooks
  };

  // Construct QuoteExactSingleParams
  const quoteParams = {
    poolKey,
    zeroForOne,
    exactAmount: parsedAmount,
    hookData: "0x" as `0x${string}`,
  };

  const { data, isLoading, isError, refetch } = useReadContract({
    address: quoterAddress,
    abi: V4QuoterAbi.abi,
    functionName: "quoteExactInputSingle",
    args: [quoteParams],
    query: {
      enabled: parsedAmount > BigInt(0),
      // Refetch every 12 seconds to keep quote fresh
      refetchInterval: 12000,
    },
  });

  const amountOut = data ? (data as [bigint, bigint])[0] : undefined;
  const gasEstimate = data ? (data as [bigint, bigint])[1] : undefined;
  
  return {
    amountOut,
    gasEstimate,
    isLoading,
    isError,
    refetch,
    outputDecimals, // Return so consumer knows how to format the output
  };
}
