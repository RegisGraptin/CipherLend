"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useConnection } from "wagmi";
import { PROTOCOL } from "@/lib/protocol";
import { useConfidentialBalance } from "@/lib/hooks/useConfidentialBalance";
import { useFHEDecrypt } from "@/lib/fhevm-sdk/react";
import { GenericStringInMemoryStorage } from "@/lib/fhevm-sdk/storage/GenericStringStorage";
import { useConnectedFhevm } from "@/lib/utils/fhevm";
import { useConnectedSigner } from "@/lib/utils/useConnectedSigner";
import { ClearBalance } from "../balance/ClearBalance";
import { EncryptedBalance } from "../balance/EncryptedBalance";

export function SwapBalance() {
  const { address: userAddress } = useConnection();
  const { data: cUsdcEncrypted } = useConfidentialBalance(PROTOCOL.address.cUSDC, userAddress as any);
  const { data: lcUsdcEncrypted } = useConfidentialBalance(PROTOCOL.address.ConfidentialLending, userAddress as any);

  const { instance: fhevm, status: fheStatus } = useConnectedFhevm();
  const { signer } = useConnectedSigner();

  const storage = new GenericStringInMemoryStorage();
  const [cUsdcBig, setCUsdcBig] = useState<bigint | undefined>(undefined);
  const [lcUsdcBig, setLcUsdcBig] = useState<bigint | undefined>(undefined);

  const [revealEncrypted, setRevealEncrypted] = useState(false);
  const [revealLending, setRevealLending] = useState(false);
  
  const [lastCHandle, setLastCHandle] = useState<string | undefined>(undefined);
  const [lastLHandle, setLastLHandle] = useState<string | undefined>(undefined);

  const requests = [
    ...(cUsdcEncrypted
      ? [{ handle: cUsdcEncrypted as string, contractAddress: PROTOCOL.address.cUSDC }]
      : []),
    ...(lcUsdcEncrypted
      ? [{ handle: lcUsdcEncrypted as string, contractAddress: PROTOCOL.address.ConfidentialLending }]
      : []),
  ];

  const { decrypt, isDecrypting, results } = useFHEDecrypt({
    instance: fhevm,
    ethersSigner: signer,
    fhevmDecryptionSignatureStorage: storage,
    chainId: PROTOCOL.chainId,
    requests,
  });

  console.log("Handles:", { cUsdcEncrypted, lcUsdcEncrypted });

  useEffect(() => {
    if (!results) return;
    const raw = results as Record<string, unknown>;
    // Process cUSDC
    if (cUsdcEncrypted && raw[cUsdcEncrypted as string] !== undefined) {
      const val = raw[cUsdcEncrypted as string];
      setCUsdcBig(val as bigint);
      setRevealEncrypted(true);
      setLastCHandle(cUsdcEncrypted as string);
    }
    // Process lcUSDC
    if (lcUsdcEncrypted && raw[lcUsdcEncrypted as string] !== undefined) {
      const val = raw[lcUsdcEncrypted as string];
      setLcUsdcBig(val as bigint);
      setRevealLending(true);
      setLastLHandle(lcUsdcEncrypted as string);
    }
  }, [results, cUsdcEncrypted, lcUsdcEncrypted]);

  // Reset when handles change (one or both); user can click Reveal again
  useEffect(() => {
    if (cUsdcEncrypted && cUsdcEncrypted !== lastCHandle) {
      setRevealEncrypted(false);
      setCUsdcBig(undefined);
    }
    if (lcUsdcEncrypted && lcUsdcEncrypted !== lastLHandle) {
      setRevealLending(false);
      setLcUsdcBig(undefined);
    }
  }, [cUsdcEncrypted, lcUsdcEncrypted, lastCHandle, lastLHandle]);

  const hasHandles = Boolean(cUsdcEncrypted || lcUsdcEncrypted);
  const allRevealed = (cUsdcEncrypted ? revealEncrypted : true) && (lcUsdcEncrypted ? revealLending : true);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balances</CardTitle>
        <CardDescription>
          Public USDC vs encrypted cUSDC inside privacy vaults.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        <ClearBalance tokenName="USDC" tokenAddress={PROTOCOL.address.UniswapUSDC} />
        <ClearBalance tokenName="UNI" tokenAddress={PROTOCOL.address.UniswapUNI} />

        <EncryptedBalance tokenName="cUSDC" decryptedValue={cUsdcBig} />

        <EncryptedBalance tokenName="lcUSDC" decryptedValue={lcUsdcBig} />

      </CardContent>
      <CardFooter className="flex items-center justify-end gap-4">
        {hasHandles && !allRevealed && (
          <Button
            variant="outline"
            onClick={() => decrypt()}
            disabled={isDecrypting || !hasHandles || fheStatus !== "ready"}
          >
            <Lock className="h-4 w-4" />
            {isDecrypting ? "Revealing balances..." : "Reveal balances"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
