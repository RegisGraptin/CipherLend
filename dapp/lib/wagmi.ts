
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { sepolia } from '@reown/appkit/networks'

export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!,
  networks: [sepolia]
})


export const config = wagmiAdapter.wagmiConfig