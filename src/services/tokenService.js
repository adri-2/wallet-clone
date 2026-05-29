import { ethers } from "ethers";
import { getProvider, getCurrentNetwork } from "./networkService";

// Clé de stockage des tokens personnalisés
const TOKENS_STORAGE_KEY = "sangowallet_tokens";

// ABI standard ERC20 (minimal)
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

// Structure d'un token
// {
//   address: "0x...",
//   name: "Tether USD",
//   symbol: "USDT",
//   decimals: 6,
//   logo: "https://...",
//   isCustom: true,
//   networkId: "ethereum_mainnet"
// }

// ========== GESTION DES TOKENS STOCKÉS ==========

// Récupérer tous les tokens pour un wallet et un réseau
export const getStoredTokens = (walletAddress, networkId) => {
  const stored = localStorage.getItem(TOKENS_STORAGE_KEY);
  if (!stored) return [];

  const allTokens = JSON.parse(stored);
  const key = `${walletAddress}_${networkId}`;
  return allTokens[key] || [];
};

// Sauvegarder un token
export const saveToken = (walletAddress, networkId, tokenData) => {
  const stored = localStorage.getItem(TOKENS_STORAGE_KEY);
  const allTokens = stored ? JSON.parse(stored) : {};

  const key = `${walletAddress}_${networkId}`;
  if (!allTokens[key]) allTokens[key] = [];

  // Vérifier si le token existe déjà
  const exists = allTokens[key].some(
    (t) => t.address.toLowerCase() === tokenData.address.toLowerCase(),
  );
  if (exists) return false;

  allTokens[key].push(tokenData);
  localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(allTokens));
  return true;
};

// Supprimer un token
export const removeToken = (walletAddress, networkId, tokenAddress) => {
  const stored = localStorage.getItem(TOKENS_STORAGE_KEY);
  if (!stored) return false;

  const allTokens = JSON.parse(stored);
  const key = `${walletAddress}_${networkId}`;

  if (!allTokens[key]) return false;

  allTokens[key] = allTokens[key].filter(
    (t) => t.address.toLowerCase() !== tokenAddress.toLowerCase(),
  );

  localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(allTokens));
  return true;
};

// ========== INTERACTION AVEC LA BLOCKCHAIN ==========

// Récupérer les infos d'un token depuis son adresse
export const fetchTokenInfo = async (tokenAddress) => {
  try {
    const provider = getProvider();
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    const [name, symbol, decimals] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
    ]);

    return {
      address: tokenAddress,
      name,
      symbol,
      decimals,
      isCustom: true,
      networkId: getCurrentNetwork().id,
    };
  } catch (error) {
    console.error("Erreur récupération token:", error);
    throw new Error(
      "Impossible de récupérer les informations du token. Vérifiez l'adresse.",
    );
  }
};

// Récupérer la balance d'un token
export const getTokenBalance = async (tokenAddress, walletAddress) => {
  try {
    const provider = getProvider();
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    const [balance, decimals] = await Promise.all([
      contract.balanceOf(walletAddress),
      contract.decimals(),
    ]);

    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error("Erreur balance token:", error);
    return "0";
  }
};

// Envoyer un token
export const sendToken = async (
  tokenAddress,
  privateKey,
  toAddress,
  amount,
) => {
  const provider = getProvider();
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

  const decimals = await contract.decimals();
  const amountWithDecimals = ethers.parseUnits(amount, decimals);

  const tx = await contract.transfer(toAddress, amountWithDecimals);
  await tx.wait();
  return tx.hash;
};

// ========== TOKENS PAR DÉFAUT ==========

// Tokens connus par réseau
export const getDefaultTokens = (networkId) => {
  const defaultTokens = {
    ethereum_mainnet: [
      {
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        name: "Tether USD",
        symbol: "USDT",
        decimals: 6,
        logo: "https://cryptologos.cc/logos/tether-usdt-logo.svg",
        isCustom: false,
      },
      {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        name: "USD Coin",
        symbol: "USDC",
        decimals: 6,
        logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.svg",
        isCustom: false,
      },
      {
        address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        name: "Dai",
        symbol: "DAI",
        decimals: 18,
        logo: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.svg",
        isCustom: false,
      },
      {
        address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
        name: "Chainlink",
        symbol: "LINK",
        decimals: 18,
        logo: "https://cryptologos.cc/logos/chainlink-link-logo.svg",
        isCustom: false,
      },
    ],
    sepolia: [
      {
        address: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0",
        name: "Tether USD (Test)",
        symbol: "USDT",
        decimals: 6,
        logo: "https://cryptologos.cc/logos/tether-usdt-logo.svg",
        isCustom: false,
      },
    ],
  };

  return defaultTokens[networkId] || [];
};

// Combiner tokens par défaut + tokens personnalisés
export const getAllTokensForWallet = (walletAddress, networkId) => {
  const defaultTokens = getDefaultTokens(networkId);
  const customTokens = getStoredTokens(walletAddress, networkId);

  return [...defaultTokens, ...customTokens];
};
