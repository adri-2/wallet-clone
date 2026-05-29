import { ethers } from "ethers";
import { getCurrentNetwork } from "./networkService";

const API_KEY = import.meta.env.VITE_ETHERSCAN_API_KEY;
const BASE_URL = "https://api.etherscan.io/v2/api";
const USDT_CONTRACT =
  import.meta.env.VITE_USDT_CONTRACT_ADDRESS ||
  "0xdAC17F958D2ee523a2206206994597C13D831ec7";

const cryptoConfig = {
  BTC: { action: "txlist" },
  ETH: { action: "txlist" },
  USDT: { action: "tokentx", contractAddress: USDT_CONTRACT },
  SOL: { action: null },
};

const DEFAULT_PAGE_SIZE = 100;
const DEFAULT_MAX_PAGES = 20;

const buildUrl = ({
  address,
  symbol,
  page = 1,
  offset = DEFAULT_PAGE_SIZE,
}) => {
  const config = cryptoConfig[symbol];
  const chainId =
    getCurrentNetwork()?.chainId ||
    import.meta.env.VITE_ETHERSCAN_CHAIN_ID ||
    "1";

  if (!config?.action || !API_KEY) {
    return null;
  }

  const params = new URLSearchParams({
    chainid: String(chainId),
    module: "account",
    action: config.action,
    address,
    page: String(page),
    offset: String(offset),
    sort: "desc",
    apikey: API_KEY,
  });

  if (config.contractAddress) {
    params.set("contractaddress", config.contractAddress);
  }

  return `${BASE_URL}?${params.toString()}`;
};

const buildTokenUrl = ({
  address,
  tokenAddress,
  page = 1,
  offset = DEFAULT_PAGE_SIZE,
}) => {
  const chainId =
    getCurrentNetwork()?.chainId ||
    import.meta.env.VITE_ETHERSCAN_CHAIN_ID ||
    "1";

  if (!API_KEY || !tokenAddress) {
    return null;
  }

  const params = new URLSearchParams({
    chainid: String(chainId),
    module: "account",
    action: "tokentx",
    address,
    contractaddress: tokenAddress,
    page: String(page),
    offset: String(offset),
    sort: "desc",
    apikey: API_KEY,
  });

  return `${BASE_URL}?${params.toString()}`;
};

const normalizeTx = (
  item,
  symbol,
  walletAddress,
  { isTokenTx = false } = {},
) => {
  const decimals = isTokenTx ? Number(item.tokenDecimal || 18) : 18;
  const amount = isTokenTx
    ? ethers.formatUnits(item.value || "0", decimals)
    : ethers.formatEther(item.value || "0");
  const wallet = walletAddress?.toLowerCase();
  const from = item.from?.toLowerCase();
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

const fetchPagedItems = async (
  buildPageUrl,
  normalize,
  { maxPages = DEFAULT_MAX_PAGES, pageSize = DEFAULT_PAGE_SIZE } = {},
) => {
  const results = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const url = buildPageUrl({ page, offset: pageSize });
    if (!url) {
      break;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Impossible de récupérer l'historique Etherscan");
    }

    const payload = await response.json();
    if (!payload || payload.status === "0") {
      const message = String(payload?.message || "");
      if (message.toLowerCase().includes("no transactions found")) {
        break;
      }

      throw new Error(
        payload?.result || message || "Réponse Etherscan invalide",
      );
    }

    const items = Array.isArray(payload.result) ? payload.result : [];
    if (items.length === 0) {
      break;
    }

    results.push(...items.map(normalize));

    if (items.length < pageSize) {
      break;
    }
  }

  return results;
};

export const fetchOnChainHistory = async ({ address, symbol }) => {
  if (!API_KEY) {
    return [];
  }

  return fetchPagedItems(
    ({ page, offset }) => buildUrl({ address, symbol, page, offset }),
    (item) => normalizeTx(item, symbol, address),
  );
};

export const fetchTokenHistory = async ({ address, tokenAddress, symbol }) => {
  if (!API_KEY || !tokenAddress) {
    return [];
  }

  const tokenSymbol = symbol || "TOKEN";

  return fetchPagedItems(
    ({ page, offset }) =>
      buildTokenUrl({ address, tokenAddress, page, offset }),
    (item) => normalizeTx(item, tokenSymbol, address, { isTokenTx: true }),
  );
};

export const canUseEtherscanHistory = (symbol) => {
  return Boolean(API_KEY && cryptoConfig[symbol]?.action);
};
