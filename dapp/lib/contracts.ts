export const CHAIN = {
  sepolia: 11155111
} as const;

export const contracts = {
  USDC: {
    [CHAIN.sepolia]: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8'
  },
  cUSDC: {
    [CHAIN.sepolia]: '0x022521db54b0BfC74d8F76a8838a63494DD00d01'
  },
  ConfidentialLending: {
    [CHAIN.sepolia]: '0x4c6faABbDD81B1c8A8d6204BA3A511467e081205'
  },
  AAVEPool: {
    [CHAIN.sepolia]: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951'
  }
} as const;
