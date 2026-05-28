//services/walletService.js
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { ethers } from "ethers";
import * as bitcoin from "bitcoinjs-lib";
import { BIP32Factory } from "bip32";
import * as ecc from "tiny-secp256k1";

import { Keypair } from "@solana/web3.js";

const bip32 = BIP32Factory(ecc);

// Générer 12 mots
export const generateSeedPhrase = () => {
  const mnemonic = generateMnemonic(128);
  return mnemonic;
};

// Valider une seed phrase
export const validateSeedPhrase = (mnemonic) => {
  const words = mnemonic.trim().split(/\s+/);
  return words.length === 12;
};

// Dériver tous les wallets depuis la seed
export const deriveAllWallets = (mnemonic) => {
  try {
    const seed = mnemonicToSeedSync(mnemonic);

    // ETH (m/44'/60'/0'/0/0)
    const ethMnemonic = ethers.Mnemonic.fromPhrase(mnemonic);
    const ethWallet = ethers.HDNodeWallet.fromMnemonic(
      ethMnemonic,
      "m/44'/60'/0'/0/0",
    );

    // BTC (m/44'/0'/0'/0/0)
    const root = bip32.fromSeed(seed);
    const btcPath = "m/44'/0'/0'/0/0";
    const btcKey = root.derivePath(btcPath);
    const { address: btcAddress } = bitcoin.payments.p2pkh({
      pubkey: btcKey.publicKey,
      network: bitcoin.networks.bitcoin,
    });

    // SOL
    const solKeypair = Keypair.fromSeed(seed.slice(0, 32));

    return {
      ethAddress: ethWallet.address,
      btcAddress: btcAddress,
      solAddress: solKeypair.publicKey.toString(),
      ethPrivateKey: ethWallet.privateKey,
      btcPrivateKey: btcKey.privateKey.toString("hex"),
      solSecretKey: Buffer.from(solKeypair.secretKey).toString("hex"),
    };
  } catch (error) {
    console.error("Erreur dérivation:", error);
    throw new Error("Seed phrase invalide");
  }
};
