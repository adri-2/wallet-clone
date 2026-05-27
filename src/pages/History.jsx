import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSessionWallet } from "../services/encryptionService";
import { getTransactionHistoryForCrypto } from "../services/historyService";
import {
  canUseEtherscanHistory,
  fetchOnChainHistory,
} from "../services/etherscanHistoryService";

const cryptoConfig = {
  BTC: {
    name: "Bitcoin",
    logo: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
  },
  ETH: {
    name: "Ethereum",
    logo: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
  },
  USDT: {
    name: "Tether",
    logo: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
  },
  SOL: {
    name: "Solana",
    logo: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
  },
};

const formatDate = (isoDate) =>
  new Date(isoDate).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const getDirectionLabel = (transaction) =>
  transaction.direction === "received" ? "Reçu" : "Envoyé";

const getDirectionTone = (transaction) =>
  transaction.direction === "received"
    ? "bg-emerald-50 text-emerald-700"
    : "bg-amber-50 text-amber-700";

export default function History() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const walletData = getSessionWallet();
  const cryptoSymbol = symbol?.toUpperCase() || "ETH";
  const crypto = cryptoConfig[cryptoSymbol] || cryptoConfig.ETH;
  const walletAddress =
    cryptoSymbol === "BTC"
      ? walletData?.btcAddress
      : cryptoSymbol === "SOL"
        ? walletData?.solAddress
        : walletData?.ethAddress;

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(Boolean(walletAddress));
  const [error, setError] = useState("");

  useEffect(() => {
    const syncSession = () => {
      if (!getSessionWallet()) {
        navigate("/dashboard", { replace: true });
      }
    };

    window.addEventListener("sangowallet-session-change", syncSession);

    return () => {
      window.removeEventListener("sangowallet-session-change", syncSession);
    };
  }, [navigate]);

  useEffect(() => {
    if (!walletAddress) {
      return;
    }

    const loadHistory = async () => {
      setLoading(true);
      setError("");

      try {
        if (canUseEtherscanHistory(cryptoSymbol)) {
          const onChainHistory = await fetchOnChainHistory({
            address: walletAddress,
            symbol: cryptoSymbol,
          });

          setTransactions(onChainHistory);
        } else {
          setTransactions(getTransactionHistoryForCrypto(cryptoSymbol));
          if (cryptoSymbol === "BTC" || cryptoSymbol === "SOL") {
            setError(
              "Historique Etherscan disponible uniquement pour les actifs EVM. Affichage de l'historique local.",
            );
          }
        }
      } catch (loadError) {
        setTransactions(getTransactionHistoryForCrypto(cryptoSymbol));
        setError(loadError.message || "Erreur de chargement de l'historique");
      } finally {
        setLoading(false);
      }
    };

    void loadHistory();
  }, [cryptoSymbol, walletAddress]);

  if (!walletData) {
    navigate("/dashboard");
    return null;
  }

  const displayError =
    error || (!walletAddress ? "Adresse du wallet indisponible" : "");

  return (
    <div className="flex flex-col gap-6 p-4 pb-8">
      <div className="flex items-center gap-3">
        <img src={crypto.logo} alt={cryptoSymbol} className="w-12 h-12" />
        <div>
          <h1 className="text-3xl font-bold">Historique {cryptoSymbol}</h1>
          <p className="text-sm text-gray-500">{crypto.name}</p>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs text-gray-500 mb-1">Adresse du wallet</p>
        <p className="font-mono text-xs break-all text-gray-800">
          {walletAddress || "Adresse indisponible"}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="font-semibold text-gray-700">
          {loading
            ? "Chargement..."
            : `${transactions.length} transaction${transactions.length > 1 ? "s" : ""}`}
        </p>
        <button
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition"
          onClick={() => navigate("/dashboard")}
        >
          Retour
        </button>
      </div>

      {displayError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
          {displayError}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500">
          Chargement de l'historique...
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500">
          Aucune transaction enregistrée pour {cryptoSymbol}.
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <p className="font-bold text-gray-900">
                    {transaction.amount} {transaction.symbol}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(transaction.createdAt)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getDirectionTone(transaction)}`}
                >
                  {getDirectionLabel(transaction)}
                </span>
              </div>

              <div className="space-y-2 text-xs text-gray-600">
                <p>
                  <span className="font-semibold text-gray-800">De :</span>{" "}
                  {transaction.from || transaction.toAddress || "-"}
                </p>
                <p>
                  <span className="font-semibold text-gray-800">Vers :</span>{" "}
                  {transaction.to || transaction.toAddress || "-"}
                </p>
                <p>
                  <span className="font-semibold text-gray-800">Hash :</span>{" "}
                  <span className="break-all">{transaction.hash}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
