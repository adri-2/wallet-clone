import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair,
} from "@solana/web3.js";

const SOLANA_RPC_URLS = [
  "https://solana-rpc.publicnode.com",
  "https://api.mainnet-beta.solana.com",
];

const getWorkingConnection = async () => {
  for (const rpcUrl of SOLANA_RPC_URLS) {
    try {
      const connection = new Connection(rpcUrl);
      await connection.getLatestBlockhash();
      return connection;
    } catch (error) {
      console.error(`Solana RPC indisponible: ${rpcUrl}`, error);
    }
  }

  throw new Error("Aucun RPC Solana disponible");
};

// Balance SOL
export const getSolBalance = async (address) => {
  try {
    const connection = await getWorkingConnection();
    const publicKey = new PublicKey(address);
    const balance = await connection.getBalance(publicKey);
    return (balance / LAMPORTS_PER_SOL).toString();
  } catch (error) {
    console.error("Erreur balance SOL:", error);
    return "0";
  }
};

// Envoyer SOL
export const sendSol = async (secretKeyHex, toAddress, amountSol) => {
  const connection = await getWorkingConnection();
  const fromKeypair = Keypair.fromSecretKey(Buffer.from(secretKeyHex, "hex"));
  const toPublicKey = new PublicKey(toAddress);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromKeypair.publicKey,
      toPubkey: toPublicKey,
      lamports: parseFloat(amountSol) * LAMPORTS_PER_SOL,
    }),
  );

  const signature = await connection.sendTransaction(transaction, [
    fromKeypair,
  ]);
  await connection.confirmTransaction(signature);
  return signature;
};
