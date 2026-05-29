// services/networkService.js
import { ethers } from "ethers";

// Configuration des réseaux supportés
export const NETWORKS = {
  ETHEREUM_MAINNET: {
    id: "ethereum_mainnet",
    name: "Ethereum Mainnet",
    chainId: 1,
    symbol: "ETH",
    rpcUrl: "https://cloudflare-eth.com",
    explorerUrl: "https://etherscan.io",
    isTestnet: false,
    icon: "🔵",
    color: "#627eea",
  },
  SEPOLIA: {
    id: "sepolia",
    name: "Sepolia Testnet",
    chainId: 11155111,
    symbol: "ETH",
    rpcUrl: "https://sepolia.infura.io/v3/2908eac17cbe4bdc8ae9214bec039bd0",
    explorerUrl: "https://sepolia.etherscan.io",
    isTestnet: true,
    icon: "🧪",
    color: "#f59e0b",
  },
  POLYGON: {
    id: "polygon",
    name: "Polygon Mainnet",
    chainId: 137,
    symbol: "MATIC",
    rpcUrl: "https://polygon-rpc.com",
    explorerUrl: "https://polygonscan.com",
    isTestnet: false,
    icon: "🟣",
    color: "#8247e5",
  },
  BSC: {
    id: "bsc",
    name: "BNB Chain",
    chainId: 56,
    symbol: "BNB",
    rpcUrl: "https://bsc-dataseed.binance.org",
    explorerUrl: "https://bscscan.com",
    isTestnet: false,
    icon: "🟡",
    color: "#f3ba2f",
  },
};

// Récupérer le réseau actif
let currentNetwork = NETWORKS.ETHEREUM_MAINNET;

const resolveCurrentNetwork = () => {
  if (typeof window === "undefined") {
    return currentNetwork;
  }

  const saved = localStorage.getItem("sangowallet_network");
  if (saved) {
    const network = Object.values(NETWORKS).find((n) => n.id === saved);
    if (network) {
      currentNetwork = network;
      return currentNetwork;
    }
    // Ancienne valeur invalide, nettoie localStorage
    localStorage.removeItem("sangowallet_network");
  }

  return currentNetwork;
};

export const getCurrentNetwork = () => {
  return resolveCurrentNetwork();
};

export const getCurrentNetworkId = () => {
  return resolveCurrentNetwork().id;
};

export const setCurrentNetwork = (networkId) => {
  const network = Object.values(NETWORKS).find((n) => n.id === networkId);
  if (network) {
    currentNetwork = network;
    localStorage.setItem("sangowallet_network", networkId);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("sangowallet-network-change", {
          detail: { networkId },
        }),
      );
    }

    return true;
  }
  return false;
};

// Obtenir un provider pour le réseau actuel
export const getProvider = () => {
  return new ethers.JsonRpcProvider(resolveCurrentNetwork().rpcUrl);
};

// Balance ETH pour le réseau actuel
export const getBalance = async (address) => {
  try {
    const provider = getProvider();
    const balanceWei = await provider.getBalance(address);
    return ethers.formatEther(balanceWei);
  } catch (error) {
    console.error(`Erreur balance ${resolveCurrentNetwork().name}:`, error);
    return "0";
  }
};

// Envoyer ETH sur le réseau actuel
export const sendEth = async (privateKey, toAddress, amountEth) => {
  const provider = getProvider();
  const wallet = new ethers.Wallet(privateKey, provider);

  const tx = await wallet.sendTransaction({
    to: toAddress,
    value: ethers.parseEther(amountEth),
  });

  await tx.wait();
  return tx.hash;
};

// Ajouter un réseau personnalisé (pour MetaMask)
export const switchNetwork = async (networkId) => {
  const network = Object.values(NETWORKS).find((n) => n.id === networkId);
  if (!network) return false;

  setCurrentNetwork(networkId);

  // Si window.ethereum existe (MetaMask)
  if (typeof window !== "undefined" && window.ethereum) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${network.chainId.toString(16)}` }],
      });
      return true;
    } catch (switchError) {
      // Si le réseau n'existe pas, l'ajouter
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${network.chainId.toString(16)}`,
                chainName: network.name,
                nativeCurrency: {
                  name: network.symbol,
                  symbol: network.symbol,
                  decimals: 18,
                },
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: [network.explorerUrl],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error("Erreur ajout réseau:", addError);
          return true;
        }
      }

      console.error("Erreur changement réseau:", switchError);
      return true;
    }
  }

  return true;
};

// Obtenir la liste de tous les réseaux
export const getAllNetworks = () => {
  return Object.values(NETWORKS);
};
