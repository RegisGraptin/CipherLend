# HackMoney

EtherVault: Confidential Batch-Lending via FHE

EtherVault is a privacy-first lending interface built on Ethereum (currently live on Sepolia). It allows users to interact with blue-chip DeFi protocols like Aave without revealing their individual financial strategies, transaction sizes, or timing.

By leveraging Fully Homomorphic Encryption (FHE), EtherVault enables a "dark pool" environment for liquidity provision, ensuring that while the protocol remains fully transparent and auditable, the individual's actions remain entirely private.
The Vision: Privacy Through Aggregate Computation

In standard DeFi, every deposit or withdrawal is public. This allows observers to track portfolios, front-run large moves, and deanonymize users. EtherVault breaks this link by decoupling the user's intent from the final blockchain transaction.
How It Works: The "Round-Based" Architecture

Unlike traditional platforms that execute trades instantly, EtherVault operates in Discrete Rounds.

    Encrypted Submission: Users submit their desired actions (Supply or Withdraw) as encrypted payloads. Thanks to FHE, the protocol can perform math on this data (e.g., adding up total deposits) without ever "seeing" the underlying numbers.

    Confidential Aggregation: During the round, the system calculates the net movement of funds across all participants while the data is still encrypted.

    Single-Tx Execution: At the close of a round, the protocol executes a single, consolidated transaction on Aave (e.g., "Deposit 500 ETH").

    Privacy Shield: Because only the aggregate total is visible on-chain, it is impossible for outside observers to determine which portion of that 500 ETH belonged to you, or if you were even participating in that specific round.

Key Features

    Total Obfuscation: Your individual liquidity positions are shielded from public block explorers.

    MEV Resistance: By batching operations and encrypting intent, the platform eliminates the ability for searchers to front-run individual users.

    Aave Integration: Tap into the deep liquidity and proven security of Aave while adding a sophisticated layer of institutional-grade privacy.

    Seamless Experience: Despite the complex cryptography under the hood, the user experience mimics a standard lending vault, requiring no specialized knowledge of FHE.

    Note: This project is currently in its alpha phase on the Sepolia Testnet, serving as a proof-of-concept for the future of private, scalable DeFi interactions.
