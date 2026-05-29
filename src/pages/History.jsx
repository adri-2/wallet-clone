import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSessionWallet } from "../services/encryptionService";
import { getTransactionHistoryForCrypto } from "../services/historyService";
import TransactionDetailsModal from "../components/TransactionDetailsModal";
import {
  canUseEtherscanHistory,
  fetchTokenHistory,
  fetchOnChainHistory,
} from "../services/etherscanHistoryService";
import {
  getAllTokensForWallet,
  getTokenBalance,
} from "../services/tokenService";
import { getCurrentNetwork } from "../services/networkService";
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
  const networkId = getCurrentNetwork().id;
  const requested = (symbol || "").toString();
  const paramUpper = requested.toUpperCase() || "ETH";

  // tokenInfo is derived from stored tokens for the current wallet/network
  const tokenInfo = useMemo(() => {
    if (!walletData) return null;
    const allTokens =
      getAllTokensForWallet(walletData?.ethAddress, networkId) || [];
    const byAddress = allTokens.find(
      (t) => t.address?.toLowerCase() === requested.toLowerCase(),
    );
    const bySymbol = allTokens.find(
      (t) => (t.symbol || "").toLowerCase() === requested.toLowerCase(),
    );
    return byAddress || bySymbol || null;
  }, [requested, walletData, networkId]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState(null);
  const [priceUsd, setPriceUsd] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    if (!walletData) {
      navigate("/dashboard");
    }
  }, [walletData, navigate]);

  useEffect(() => {
    if (!walletData) return;

    const effectiveToken = tokenInfo;
    const effectiveSymbol = effectiveToken ? effectiveToken.symbol : paramUpper;
    const effectiveWalletAddress = effectiveToken
      ? walletData?.ethAddress
      : effectiveSymbol === "BTC"
        ? walletData?.btcAddress
        : effectiveSymbol === "SOL"
          ? walletData?.solAddress
          : walletData?.ethAddress;

    if (!effectiveWalletAddress) return;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        // balance
        let b = "0";
        if (effectiveToken) {
          b = await getTokenBalance(
            effectiveToken.address,
            effectiveWalletAddress,
          );
        } else if (effectiveSymbol === "ETH") {
          b = await getEthBalance(effectiveWalletAddress);
        } else if (effectiveSymbol === "USDT") {
          b = await getUsdtBalance(effectiveWalletAddress);
        } else if (effectiveSymbol === "SOL") {
          b = await getSolBalance(effectiveWalletAddress);
        } else if (effectiveSymbol === "BTC") {
          b = await getBtcBalance(effectiveWalletAddress);
        }
        setBalance(b);

        // price
        try {
          const prices = await getCryptoPrices();
          const map = {
            BTC: prices.btc,
            ETH: prices.eth,
            SOL: prices.sol,
            USDT: prices.usdt,
          };
          setPriceUsd(
            effectiveToken
              ? prices[(effectiveToken.symbol || "").toLowerCase()] || 0
              : map[effectiveSymbol] || 0,
          );
        } catch (pErr) {
          console.error("Erreur recuperation prix:", pErr);
          setPriceUsd(0);
        }

        // history
        if (effectiveToken) {
          const tokenHistory = await fetchTokenHistory({
            address: effectiveWalletAddress,
            tokenAddress: effectiveToken.address,
            symbol: effectiveToken.symbol,
          });

          setTransactions(
            tokenHistory.length > 0
              ? tokenHistory
              : getTransactionHistoryForCrypto(effectiveToken.symbol),
          );
        } else if (canUseEtherscanHistory(effectiveSymbol)) {
          const onChain = await fetchOnChainHistory({
            address: effectiveWalletAddress,
            symbol: effectiveSymbol,
          });
          setTransactions(onChain);
        } else {
          setTransactions(getTransactionHistoryForCrypto(effectiveSymbol));
          if (effectiveSymbol === "BTC" || effectiveSymbol === "SOL") {
            setError(
              "Historique Etherscan disponible uniquement pour les actifs EVM. Affichage de l'historique local.",
            );
          }
        }
      } catch (err) {
        console.error(err);
        setError(err?.message || "Erreur de chargement");
        setTransactions(getTransactionHistoryForCrypto(effectiveSymbol));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [tokenInfo, requested, paramUpper, walletData, networkId]);

  const handleOpenTransaction = (tx) => {
    setSelectedTransaction(tx);
    setOpenModal(true);
  };

  const effectiveSymbol = tokenInfo ? tokenInfo.symbol : paramUpper;
  const crypto = tokenInfo
    ? { name: tokenInfo.name, logo: tokenInfo.logo || null }
    : cryptoConfig[effectiveSymbol] || cryptoConfig.ETH;
  const displayError =
    error || (!walletData ? "Adresse du wallet indisponible" : "");

  return (
    <div className="flex flex-col gap-6 p-4 pb-8 ">
      <div className="flex flex-col gap-2">
        <div className="flex  justify-start gap-3">
          {crypto.logo ? (
            <img src={crypto.logo} alt={effectiveSymbol} className="w-12 h-12" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
              {effectiveSymbol?.slice(0, 2) || "?"}
            </div>
          )}
          <h1 className="text-3xl font-bold"> {effectiveSymbol}</h1>
          <p className="text-sm text-gray-500">{crypto.name}</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="font-bold text-2xl  text-gray-900">
            ${((parseFloat(balance || 0) || 0) * (priceUsd || 0)).toFixed(2)}
          </p>
          <p className="text-xl text-gray-500 mt-2">
            {balance === null
              ? "—"
              : `${parseFloat(balance).toFixed(6)} ${effectiveSymbol}`}
          </p>
        </div>

        <div className=" p-2 flex items-center justify-center  gap-8">
          <div>
            <button
              className="px-6 py-2 bg-violet-600 text-white rounded-lg text-lg cursor-pointer hover:bg-violet-700 transition"
              onClick={() =>
                navigate("/send", {
                  state: {
                    symbol: effectiveSymbol,
                    tokenAddress: tokenInfo?.address,
                  },
                })
              }
            >
              Envoyer
            </button>
          </div>
          <div>
            <button
              className="px-6 py-2 bg-gray-200 rounded-lg text-lg cursor-pointer hover:bg-gray-300 transition"
              onClick={() =>
                navigate("/receive", {
                  state: {
                    symbol: effectiveSymbol,
                    tokenAddress: tokenInfo?.address,
                  },
                })
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
          Aucune transaction enregistrée pour {effectiveSymbol}.
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-100 pr-1 scrollbar-none">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              onClick={() => handleOpenTransaction(transaction)}
              className="bg-gray-200 border border-gray-300 rounded-xl p-4 shadow-sm cursor-pointer hover:border-violet-400 transition"
            >
              <div className="flex items-center justify-between gap-4 mb-3">
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
