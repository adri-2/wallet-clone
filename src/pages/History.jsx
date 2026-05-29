import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSessionWallet } from "../services/encryptionService";
import { getTransactionHistoryForCrypto } from "../services/historyService";
import TransactionDetailsModal from "../components/TransactionDetailsModal";
import {
  canUseEtherscanHistory,
  fetchOnChainHistory,
} from "../services/etherscanHistoryService";
import { getEthBalance, getUsdtBalance } from "../services/ethService";
import { getSolBalance } from "../services/solService";
import { getBtcBalance } from "../services/btcService";
import { getCryptoPrices } from "../services/priceService";

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

// const formatDate = (isoDate) =>
//   new Date(isoDate).toLocaleString("fr-FR", {
//     dateStyle: "medium",
//     timeStyle: "short",
//   });

const getDirectionLabel = (transaction) =>
  transaction.direction === "received" ? "Reçu" : "Envoyé";

const getDirectionTone = (transaction) =>
  transaction.direction === "received"
    ? "bg-emerald-50 text-emerald-700"
    : "bg-amber-50 text-amber-700";

const maskAddress = (addr) => {
  if (!addr) return "-";
  const s = String(addr);
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}...${s.slice(-4)}`;
};

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
  const [balance, setBalance] = useState(null);
  const [priceUsd, setPriceUsd] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const [openModal, setOpenModal] = useState(false);
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

  const handleOpenTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setOpenModal(true);
  };

  useEffect(() => {
    if (!walletAddress) {
      return;
    }
    const loadBalance = async () => {
      try {
        let b = "0";
        if (cryptoSymbol === "ETH") {
          b = await getEthBalance(walletAddress);
        } else if (cryptoSymbol === "USDT") {
          b = await getUsdtBalance(walletAddress);
        } else if (cryptoSymbol === "SOL") {
          b = await getSolBalance(walletAddress);
        } else if (cryptoSymbol === "BTC") {
          b = await getBtcBalance(walletAddress);
        }

        setBalance(b);
        // fetch price for selected crypto
        try {
          const prices = await getCryptoPrices();
          const map = {
            BTC: prices.btc,
            ETH: prices.eth,
            SOL: prices.sol,
            USDT: prices.usdt,
          };
          setPriceUsd(map[cryptoSymbol] || 0);
        } catch (pErr) {
          console.error("Erreur recuperation prix:", pErr);
          setPriceUsd(0);
        }
      } catch (err) {
        console.error("Erreur balance:", err);
        setBalance(null);
      }
    };

    void loadBalance();

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
    <div className="flex flex-col gap-6 p-4 pb-8 ">
      <div className="flex flex-col gap-2">
        <div className="flex  justify-start gap-3">
          <img src={crypto.logo} alt={cryptoSymbol} className="w-12 h-12" />
          <h1 className="text-3xl font-bold"> {cryptoSymbol}</h1>
          <p className="text-sm text-gray-500">{crypto.name}</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          {/* prix en dollars */}
          <p className="font-bold text-2xl  text-gray-900">
            ${((parseFloat(balance || 0) || 0) * (priceUsd || 0)).toFixed(2)}
          </p>

          {/* prix en crypto */}
          <p className="text-xl text-gray-500 mt-2">
            {/* Solde:{" "} */}
            {balance === null
              ? "—"
              : `${parseFloat(balance).toFixed(6)} ${cryptoSymbol}`}
          </p>
        </div>
        <div className=" p-2 flex items-center justify-center  gap-8">
          <div>
            <button
              className="px-6 py-2 bg-violet-600 text-white rounded-lg text-lg cursor-pointer hover:bg-violet-700 transition"
              onClick={() =>
                navigate("/send", { state: { symbol: cryptoSymbol } })
              }
            >
              Envoyer
            </button>
          </div>
          {/*  */}
          <div>
            <button
              className="px-6 py-2 bg-gray-200 rounded-lg text-lg cursor-pointer hover:bg-gray-300 transition"
              onClick={() =>
                navigate("/receive", { state: { symbol: cryptoSymbol } })
              }
            >
              Recevoir
            </button>
          </div>
        </div>
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
              onClick={() => handleOpenTransaction(transaction)}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-pointer hover:border-violet-400 transition"
            >
              <div className="flex items-center justify-between gap-4 mb-3">
                {/* <div>
                  <p className="font-bold text-gray-900">
                    {transaction.amount} {transaction.symbol}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(transaction.createdAt)}
                  </p>
                </div> */}
                <span
                  className={`px-3 py-1 rounded-full text-lg font-semibold ${getDirectionTone(transaction)}`}
                >
                  {getDirectionLabel(transaction)}
                </span>
              </div>

              <div className="space-y-2 text-lg text-gray-600">
                {transaction.direction === "received" ? (
                  <p>
                    <span className="font-semibold text-lg text-gray-800">
                      De :
                    </span>{" "}
                    {maskAddress(transaction.from || transaction.toAddress)}
                    <span className="ml-2 text-lg font-semibold">
                      {transaction.amount} {transaction.symbol}
                    </span>
                  </p>
                ) : (
                  <p>
                    <span className="font-semibold text-lg text-gray-800">
                      Vers :
                    </span>{" "}
                    {maskAddress(transaction.to || transaction.toAddress)}
                    <span className="ml-2 text-lg font-semibold">
                      {transaction.amount} {transaction.symbol}
                    </span>
                  </p>
                )}

                {/* <p>
                  <span className="font-semibold text-gray-800">Hash :</span>{" "}
                  <span className="break-all">{transaction.hash}</span>
                </p> */}
              </div>
            </div>
          ))}
        </div>
      )}

      <TransactionDetailsModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
}
