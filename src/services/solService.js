import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair,
} from "@solana/web3.js";

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

// Balance SOL
export const getSolBalance = async (address) => {
  try {
    const connection = new Connection(SOLANA_RPC);
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
  const connection = new Connection(SOLANA_RPC);
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
