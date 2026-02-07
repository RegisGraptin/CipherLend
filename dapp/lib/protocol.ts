import { CHAIN, contracts } from "./contracts";
import cUSDC from "./abis/ERC7984Mock.json" assert { type: "json" };
import ConfidentialLending from "./abis/ConfidentialLending.json" assert { type: "json" };
import ConfidentialSwap from "./abis/ConfidentialSwap.json" assert { type: "json" };
import V4Quoter from "./abis/V4Quoter.json" assert { type: "json" };

export const PROTOCOL = {
  chainId: CHAIN.sepolia,
  address: {
    // Tokens
    USDC: contracts.USDC[CHAIN.sepolia] as `0x${string}`,
    cUSDC: contracts.cUSDC[CHAIN.sepolia] as `0x${string}`,

    // Uniswap specific tokens (note different USDC addresses)
    UniswapUSDC: contracts.Uniswap.USDC[CHAIN.sepolia] as `0x${string}`,
    UniswapUNI: contracts.Uniswap.UNI[CHAIN.sepolia] as `0x${string}`,

    // Confidential versions of Uniswap tokens (note these are different from the protocol's cUSDC)
    UniswapCUsdc: contracts.Uniswap.cUSDC[CHAIN.sepolia] as `0x${string}`,
    UniswapCUni: contracts.Uniswap.cUNI[CHAIN.sepolia] as `0x${string}`,

    // Protocol
    ConfidentialSwap: contracts.ConfidentialSwap[CHAIN.sepolia] as `0x${string}`,
    
    ConfidentialLending: contracts.ConfidentialLending[CHAIN.sepolia] as `0x${string}`,
    AAVEPool: contracts.AAVEPool[CHAIN.sepolia] as `0x${string}`,

    // Uniswap V4
    V4Quoter: contracts.V4Quoter[CHAIN.sepolia] as `0x${string}`,
  },
  abi: {
    cToken: cUSDC.abi,
    ConfidentialLending: ConfidentialLending.abi,
    ConfidentialSwap: ConfidentialSwap.abi,
    V4Quoter: V4Quoter.abi,
  },
  decimals: {
    USDC: 6,
    cUSDC: 6,
    UNI: 18,
    cUNI: 6,
  }
} as const;

export type ContractKey = keyof typeof PROTOCOL.address;