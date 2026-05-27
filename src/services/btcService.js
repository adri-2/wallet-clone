import * as bitcoin from "bitcoinjs-lib";
import axios from "axios";

const BTC_NETWORK = bitcoin.networks.bitcoin;
const API_BASE = "https://blockstream.info/api";

// Balance BTC
export const getBtcBalance = async (address) => {
  try {
    const response = await axios.get(`${API_BASE}/address/${address}`);
    const satoshis =
      response.data.chain_stats.funded_txo_sum -
      response.data.chain_stats.spent_txo_sum;
    return (satoshis / 100000000).toString();
  } catch (error) {
    console.error("Erreur balance BTC:", error);
    return "0";
  }
};

// Envoyer BTC
export const sendBtc = async (privateKeyHex, toAddress, amountBtc) => {
  try {
    // Créer la clé privée et l'adresse source
    const privateKeyBuffer = Buffer.from(privateKeyHex, "hex");
    const { address: fromAddress, output: outputScript } =
      bitcoin.payments.p2pkh({
        pubkey: bitcoin.ECPair.fromPrivateKeyBuffer(privateKeyBuffer).publicKey,
        network: BTC_NETWORK,
      });

    // Récupérer les UTXO
    const response = await axios.get(`${API_BASE}/address/${fromAddress}/utxo`);
    const utxos = response.data;

    if (!utxos || utxos.length === 0) {
      throw new Error("Pas d'UTXO disponible pour cette adresse");
    }

    // Construire la transaction
    const psbt = new bitcoin.Psbt({ network: BTC_NETWORK });
    const amountSatoshis = Math.floor(amountBtc * 100000000);
    let totalInput = 0;
    const feePerByte = 5;
    let selectedUtxos = [];

    // Sélectionner les UTXO nécessaires
    for (const utxo of utxos) {
      selectedUtxos.push(utxo);
      totalInput += utxo.value;

      if (totalInput >= amountSatoshis) {
        break;
      }
    }

    if (totalInput < amountSatoshis) {
      throw new Error("Solde insuffisant pour cette transaction");
    }

    // Ajouter les inputs
    for (const utxo of selectedUtxos) {
      const txResponse = await axios.get(`${API_BASE}/tx/${utxo.txid}/hex`);
      const txHex = txResponse.data;

      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        nonWitnessUtxo: Buffer.from(txHex, "hex"),
      });
    }

    // Estimer les frais
    const estimatedSize = selectedUtxos.length * 148 + 34 + 10;
    const fee = estimatedSize * feePerByte;
    const change = totalInput - amountSatoshis - fee;

    if (change < 0) {
      throw new Error("Montant insuffisant après les frais");
    }

    // Ajouter les outputs
    psbt.addOutput({
      address: toAddress,
      value: amountSatoshis,
    });

    if (change > 546) {
      psbt.addOutput({
        address: fromAddress,
        value: change,
      });
    }

    // Signer la transaction
    const keyPair = bitcoin.ECPair.fromPrivateKeyBuffer(privateKeyBuffer, {
      network: BTC_NETWORK,
    });

    for (let i = 0; i < selectedUtxos.length; i++) {
      psbt.signInput(i, keyPair);
    }

    psbt.finalizeAllInputs();
    const tx = psbt.extractTransaction();
    const txHex = tx.toHex();

    // Envoyer la transaction
    const broadcastResponse = await axios.post(`${API_BASE}/tx`, txHex, {
      headers: { "Content-Type": "text/plain" },
    });

    return broadcastResponse.data;
  } catch (error) {
    console.error("Erreur envoi BTC:", error);
    throw new Error(error.message || "Erreur lors de l'envoi de Bitcoin");
  }
};
