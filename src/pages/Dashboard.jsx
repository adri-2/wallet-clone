import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadWallet,
  getSessionWallet,
  setSessionWallet,
  setSessionPassword,
} from "../services/encryptionService";
import { getEthBalance, getUsdtBalance } from "../services/ethService";
import { getSolBalance } from "../services/solService";
import { getCryptoPrices } from "../services/priceService";
import {
  getAllNetworks,
  getCurrentNetwork,
  switchNetwork,
} from "../services/networkService";
import {
  getAllTokensForWallet,
  getTokenBalance,
} from "../services/tokenService";

const CryptoCard = ({
  name,
  symbol,
  logo,
  balance,
  price,
  decimals,
  onClick,
}) => (
  <button
    type="button"
    className="w-full flex gap-3 justify-between items-center bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition text-left cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-center gap-3">
      {logo ? (
        <img src={logo} alt={symbol} className="w-12 h-12 rounded-full" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
          {symbol?.slice(0, 2) || "?"}
        </div>
      )}
      <div>
        <h3 className="font-bold text-sm text-gray-900">{name}</h3>
        <p className="text-xs text-gray-600">
          {parseFloat(balance).toFixed(decimals)} {symbol}
        </p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-bold text-gray-900">
        ${(parseFloat(balance || 0) * price).toFixed(2)}
      </p>
    </div>
  </button>
);

export default function Dashboard() {
  const [walletData, setWalletData] = useState(() => getSessionWallet());
  const [balances, setBalances] = useState({});
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [prices, setPrices] = useState({ btc: 0, eth: 0, sol: 0, usdt: 0 });
  const [currentNetworkId, setCurrentNetworkId] = useState(
    () => getCurrentNetwork().id,
  );
  const [customTokens, setCustomTokens] = useState([]);

  const handleUnlock = async () => {
    setLoading(true);
    const data = loadWallet(password);
    if (!data) {
      setError("Mot de passe incorrect");
      setLoading(false);
      return;
    }
    setWalletData(data);
    setSessionWallet(data);
    setSessionPassword(password);
    await fetchBalances(data);
    setLoading(false);
  };

  const handleNetworkChange = async (networkId) => {
    setCurrentNetworkId(networkId);
    const switched = await switchNetwork(networkId);

    if (!switched) {
      setCurrentNetworkId(getCurrentNetwork().id);
    }
  };
  const fetchBalances = useCallback(
    async (data) => {
      try {
        const [ethResult, usdtResult, solResult, cryptoPricesResult] =
          await Promise.allSettled([
            getEthBalance(data.ethAddress),
            getUsdtBalance(data.ethAddress),
            getSolBalance(data.solAddress),
            getCryptoPrices(),
          ]);

        const nextBalances = {
          eth: ethResult.status === "fulfilled" ? ethResult.value : "0",
          usdt: usdtResult.status === "fulfilled" ? usdtResult.value : "0",
          sol: solResult.status === "fulfilled" ? solResult.value : "0",
          btc: "0",
        };

        const nextPrices =
          cryptoPricesResult.status === "fulfilled"
            ? cryptoPricesResult.value
            : { btc: 0, eth: 0, sol: 0, usdt: 0 };

        setBalances(nextBalances);
        setPrices(nextPrices);

        const allTokens = getAllTokensForWallet(
          data.ethAddress,
          currentNetworkId,
        );
        const importedTokens = allTokens.filter((token) => token.isCustom);

        const tokensWithBalances = await Promise.all(
          importedTokens.map(async (token) => {
            const balance = await getTokenBalance(
              token.address,
              data.ethAddress,
            );
            return { ...token, balance };
          }),
        );

        setCustomTokens(tokensWithBalances);
      } catch (err) {
        console.error("Erreur chargement balances", err);
        setCustomTokens([]);
      }
    },
    [currentNetworkId],
  );

  useEffect(() => {
    const syncSession = () => {
      const sessionWallet = getSessionWallet();
      setWalletData(sessionWallet);

      if (!sessionWallet) {
        setBalances({});
        setError("");
        setPassword("");
      }
    };

    const handleWalletChanged = (event) => {
      const { wallet } = event.detail || {};
      if (wallet) {
        setWalletData(wallet);
        // Force rechargement des balances au changement de wallet
        void fetchBalances(wallet);
      }
    };

    const syncNetwork = () => {
      setCurrentNetworkId(getCurrentNetwork().id);
    };

    window.addEventListener("sangowallet-session-change", syncSession);
    window.addEventListener("sangowallet-wallet-changed", handleWalletChanged);
    window.addEventListener("sangowallet-network-change", syncNetwork);

    return () => {
      window.removeEventListener("sangowallet-session-change", syncSession);
      window.removeEventListener(
        "sangowallet-wallet-changed",
        handleWalletChanged,
      );
      window.removeEventListener("sangowallet-network-change", syncNetwork);
    };
  }, [fetchBalances]);

  useEffect(() => {
    if (walletData) {
      void fetchBalances(walletData);
    }
  }, [walletData, fetchBalances]);

  if (!walletData) {
    return (
      <div className="flex flex-col items-center justify-center p-4 gap-6 min-h-[calc(100vh-64px)]">
        <h1 className="text-3xl font-bold bg-linear-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
          SANGOWALLET
        </h1>
        <div className="w-full gap-4 flex flex-col">
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500"
            onKeyPress={(e) => e.key === "Enter" && handleUnlock()}
          />
          {error && (
            <div className="text-red-600 font-semibold text-center">
              {error}
            </div>
          )}
          <button
            className="px-4 py-3 bg-violet-600 text-white hover:bg-violet-700 cursor-pointer rounded-lg font-semibold transition"
            onClick={handleUnlock}
            disabled={loading}
          >
            {loading ? "Déverrouillage..." : "Déverrouiller"}
          </button>
          <button
            className="px-4 py-3 bg-gray-200 text-black hover:bg-gray-300 cursor-pointer rounded-lg font-semibold transition"
            onClick={() => navigate("/create")}
          >
            Créer un nouveau wallet
          </button>
          <button
            className="px-4 py-3 bg-violet-600 text-white hover:bg-violet-700 cursor-pointer rounded-lg font-semibold transition"
            onClick={() => navigate("/import")}
          >
            Importer un wallet
          </button>
        </div>
      </div>
    );
  }
  const totalUsd =
    parseFloat(balances.btc || 0) * prices.btc +
    parseFloat(balances.eth || 0) * prices.eth +
    parseFloat(balances.sol || 0) * prices.sol +
    parseFloat(balances.usdt || 0) * prices.usdt;

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <div className="bg-linear-to-r from-violet-600 to-pink-500 text-white p-6 rounded-xl shadow-lg">
        <p className="text-sm opacity-90 mb-2">Solde Total</p>
        <h1 className="text-4xl font-bold">${totalUsd.toFixed(2)}</h1>
      </div>

      <div className="flex gap-3">
        <button
          className="flex-1 bg-violet-600 hover:bg-violet-700 px-4 py-3 rounded-lg text-white font-bold cursor-pointer transition shadow-md"
          onClick={() => navigate("/send")}
        >
          Envoyer
        </button>
        <button
          className="flex-1 bg-violet-600 hover:bg-violet-700 px-4 py-3 rounded-lg text-white font-bold cursor-pointer transition shadow-md"
          onClick={() => navigate("/receive")}
        >
          Recevoir
        </button>
      </div>

      <button
        className="w-full bg-gray-900 hover:bg-black px-4 py-3 rounded-lg text-white font-bold cursor-pointer transition shadow-md"
        onClick={() => navigate("/import-token")}
      >
        Importer un token
      </button>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          Réseau:
          <select
            value={currentNetworkId}
            onChange={(event) => handleNetworkChange(event.target.value)}
            className="bg-white text-gray-900 rounded-md px-3 py-2 font-semibold focus:outline-none border border-gray-300"
          >
            {getAllNetworks().map((network) => (
              <option key={network.id} value={network.id}>
                {network.icon} {network.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-3">
        <CryptoCard
          name="Bitcoin"
          symbol="BTC"
          logo="https://assets.coingecko.com/coins/images/1/large/bitcoin.png"
          balance={balances.btc}
          price={prices.btc}
          decimals={8}
          onClick={() => navigate("/history/BTC")}
        />
        <CryptoCard
          name="Ethereum"
          symbol="ETH"
          logo="https://assets.coingecko.com/coins/images/279/large/ethereum.png"
          balance={balances.eth}
          price={prices.eth}
          decimals={8}
          onClick={() => navigate("/history/ETH")}
        />
        <CryptoCard
          name="Tether"
          symbol="USDT"
          logo="https://assets.coingecko.com/coins/images/325/large/Tether.png"
          balance={balances.usdt}
          price={prices.usdt}
          decimals={2}
          onClick={() => navigate("/history/USDT")}
        />
        <CryptoCard
          name="Solana"
          symbol="SOL"
          logo="https://assets.coingecko.com/coins/images/4128/large/solana.png"
          balance={balances.sol}
          price={prices.sol}
          decimals={4}
          onClick={() => navigate("/history/SOL")}
        />

        {customTokens.map((token) => (
          <CryptoCard
            key={`${token.address}-${currentNetworkId}`}
            name={token.name}
            symbol={token.symbol}
            logo={token.logo || null}
            balance={token.balance || "0"}
            price={0}
            // decimals={typeof token.decimals === "number" ? token.decimals : 4}
            onClick={() =>
              navigate(`/history/${encodeURIComponent(token.address)}`)
            }
          />
        ))}
      </div>
    </div>
  );
}
