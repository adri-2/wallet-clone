import { ethers } from "ethers";

const API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY;
const BASE_URL = "https://api.etherscan.io/v2/api";
const DEFAULT_CHAIN_ID = import.meta.env.VITE_ETHERSCAN_CHAIN_ID || "1";
const USDT_CONTRACT =
  import.meta.env.VITE_USDT_CONTRACT_ADDRESS ||
  "0xdAC17F958D2ee523a2206206994597C13D831ec7";

const cryptoConfig = {
  BTC: { action: "txlist" },
  ETH: { action: "txlist" },
  USDT: { action: "tokentx", contractAddress: USDT_CONTRACT },
  SOL: { action: null },
};

const buildUrl = ({ address, symbol }) => {
  const config = cryptoConfig[symbol];

  if (!config?.action || !API_KEY) {
    return null;
  }

  const params = new URLSearchParams({
    chainid: DEFAULT_CHAIN_ID,
    module: "account",
    action: config.action,
    address,
    page: "1",
    offset: "20",
    sort: "desc",
    apikey: API_KEY,
  });

  if (config.contractAddress) {
    params.set("contractaddress", config.contractAddress);
  }

  return `${BASE_URL}?${params.toString()}`;
};

const normalizeTx = (item, symbol, walletAddress) => {
  const isTokenTx = symbol === "USDT";
  const decimals = isTokenTx ? Number(item.tokenDecimal || 6) : 18;
  const amount = isTokenTx
    ? ethers.formatUnits(item.value || "0", decimals)
    : ethers.formatEther(item.value || "0");
  const wallet = walletAddress?.toLowerCase();
  const from = item.from?.toLowerCase();
  const to = item.to?.toLowerCase();
  const direction = wallet && from === wallet ? "sent" : "received";

  return {
    id: `${item.hash}-${item.logIndex ?? item.nonce ?? item.timeStamp}`,
    hash: item.hash,
    from: item.from,
    to: item.to,
    amount,
    symbol: item.tokenSymbol || symbol,
    createdAt: new Date(Number(item.timeStamp || 0) * 1000).toISOString(),
    direction,
    status:
      item.txreceipt_status === "1" || item.isError === "0"
        ? "success"
        : "failed",
  };
};

export const fetchOnChainHistory = async ({ address, symbol }) => {
  const url = buildUrl({ address, symbol });

  if (!url) {
    return [];
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Impossible de récupérer l'historique Etherscan");
  }

  const payload = await response.json();

  if (!payload || payload.status === "0") {
    const message = String(payload?.message || "");
    if (message.toLowerCase().includes("no transactions found")) {
      return [];
    }

    throw new Error(payload?.result || message || "Réponse Etherscan invalide");
  }

  const items = Array.isArray(payload.result) ? payload.result : [];
  return items.map((item) => normalizeTx(item, symbol, address));
};

export const canUseEtherscanHistory = (symbol) => {
  return Boolean(API_KEY && cryptoConfig[symbol]?.action);
};
