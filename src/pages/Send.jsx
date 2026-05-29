import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getSessionWallet,
  setSessionWallet,
} from "../services/encryptionService";
import { sendEth, sendUsdt } from "../services/ethService";
import { sendSol } from "../services/solService";
import { sendBtc } from "../services/btcService";
import { addTransactionHistory } from "../services/historyService";
import { sendToken } from "../services/tokenService";

export default function Send() {
  const location = useLocation();
  const [walletData, setWalletData] = useState(getSessionWallet());
  const initialSymbol =
    (location.state && location.state.symbol) ||
    new URLSearchParams(location.search).get("symbol") ||
    "ETH";
  const [crypto, setCrypto] = useState(() => initialSymbol || "ETH");
  const tokenAddress =
    (location.state && location.state.tokenAddress) ||
    new URLSearchParams(location.search).get("tokenAddress") ||
    "";
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const syncSession = () => {
      const sessionWallet = getSessionWallet();
      setWalletData(sessionWallet);

      if (!sessionWallet) {
        navigate("/dashboard", { replace: true });
      }
    };

    window.addEventListener("sangowallet-session-change", syncSession);

    return () => {
      window.removeEventListener("sangowallet-session-change", syncSession);
    };
  }, [navigate]);

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
        case "BTC":
          hash = await sendBtc(walletData.btcPrivateKey, toAddress, amount);
          break;
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
          if (!tokenAddress) {
            throw new Error("Adresse du token manquante");
          }

          hash = await sendToken(
            tokenAddress,
            walletData.ethPrivateKey,
            toAddress,
            amount,
          );
          break;
      }

      addTransactionHistory({
        symbol: crypto,
        amount,
        toAddress,
        hash,
      });

      setTxHash(hash);
      alert(` Transaction envoyée !\nHash: ${hash}`);
    } catch (err) {
      setError(`Erreur: ${err.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6 p-4 pb-8">
      <h1 className="text-3xl font-bold"> Envoyer des cryptos</h1>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Crypto
          </label>
          <select
            value={crypto}
            onChange={(e) => setCrypto(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50"
          >
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ETH)</option>
            <option value="USDT">Tether (USDT)</option>
            <option value="SOL">Solana (SOL)</option>
            {tokenAddress &&
              !["BTC", "ETH", "USDT", "SOL"].includes(crypto) && (
                <option value={crypto}>{crypto} (token importé)</option>
              )}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Sélection actuelle: {crypto}
          </p>
        </div>

        {tokenAddress && (
          <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm">
            <div className="font-semibold text-gray-700 mb-1">
              Token importé
            </div>
            <div className="font-mono text-xs break-all text-gray-600">
              {tokenAddress}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Destinataire
          </label>
          <input
            type="text"
            placeholder="Adresse du destinataire"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Montant
          </label>
          <input
            type="number"
            placeholder="Montant"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50"
            step="0.000001"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {txHash && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">
            Hash: {txHash.slice(0, 20)}...
          </div>
        )}

        <button
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? "Envoi en cours..." : "Envoyer"}
        </button>

        <button
          className="w-full bg-gray-200 hover:bg-gray-300 text-black font-bold py-3 rounded-lg transition"
          onClick={() => navigate("/dashboard")}
        >
          Retour
        </button>
      </div>
    </div>
  );
}
