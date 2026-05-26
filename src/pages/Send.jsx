import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getSessionWallet,
  setSessionWallet,
} from "../services/encryptionService";
import { sendEth, sendUsdt } from "../services/ethService";
import { sendSol } from "../services/solService";

export default function Send() {
  const [walletData, setWalletData] = useState(getSessionWallet());
  const [crypto, setCrypto] = useState("ETH");
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  if (!walletData) {
    navigate("/dashboard");
    return null;
  }

  const handleSend = async () => {
    if (!toAddress || !amount) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let hash;
      switch (crypto) {
        case "ETH":
          hash = await sendEth(walletData.ethPrivateKey, toAddress, amount);
          break;
        case "USDT":
          hash = await sendUsdt(walletData.ethPrivateKey, toAddress, amount);
          break;
        case "SOL":
          hash = await sendSol(walletData.solSecretKey, toAddress, amount);
          break;
        default:
          throw new Error("Crypto non supportée");
      }
      setTxHash(hash);
      alert(`✅ Transaction envoyée !\nHash: ${hash}`);
    } catch (err) {
      setError(`Erreur: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <div className="card">
        <h1>📤 Envoyer des cryptos</h1>

        <select
          value={crypto}
          onChange={(e) => setCrypto(e.target.value)}
          className="input-field"
        >
          <option value="ETH">Ethereum (ETH)</option>
          <option value="USDT">Tether (USDT)</option>
          <option value="SOL">Solana (SOL)</option>
        </select>

        <input
          type="text"
          placeholder="Adresse du destinataire"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
          className="input-field"
        />

        <input
          type="number"
          placeholder="Montant"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input-field"
          step="0.000001"
        />

        {error && <div className="error">{error}</div>}
        {txHash && (
          <div className="success">Hash: {txHash.slice(0, 20)}...</div>
        )}

        <button className="btn-primary" onClick={handleSend} disabled={loading}>
          {loading ? "Envoi en cours..." : "Envoyer"}
        </button>

        <button
          className="btn-secondary"
          onClick={() => navigate("/dashboard")}
        >
          Retour
        </button>
      </div>
    </div>
  );
}
