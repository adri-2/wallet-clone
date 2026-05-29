//services/ethService.js
import { ethers } from "ethers";
import { getCurrentNetwork } from "./networkService";

const ETH_RPC_URLS = [
  "https://ethereum-rpc.publicnode.com",
  "https://rpc.ankr.com/eth",
  "https://cloudflare-eth.com",
];
const SEPOLIA_RPC_URLS = [
  "https://sepolia.infura.io/v3/2908eac17cbe4bdc8ae9214bec039bd0",
];
const USDT_CONTRACT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const USDT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

const getRpcUrls = () => {
  const network = getCurrentNetwork();

  if (network.chainId === 11155111) {
    return SEPOLIA_RPC_URLS;
  }

  return ETH_RPC_URLS;
};

const getWorkingProvider = async () => {
  for (const rpcUrl of getRpcUrls()) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      await provider.getBlockNumber();
      return provider;
    } catch (error) {
      console.error(`ETH RPC indisponible: ${rpcUrl}`, error);
    }
  }

  throw new Error("Aucun RPC Ethereum disponible");
};

// Balance ETH
export const getEthBalance = async (address) => {
  try {
    const provider = await getWorkingProvider();
    const balanceWei = await provider.getBalance(address);
    return ethers.formatEther(balanceWei);
  } catch (error) {
    console.error("Erreur balance ETH:", error);
    return "0";
  }
};

// Balance USDT
export const getUsdtBalance = async (address) => {
  try {
    const network = getCurrentNetwork();

    if (network.chainId !== 1) {
      return "0";
    }

    const provider = await getWorkingProvider();
    const contract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, provider);
    const balance = await contract.balanceOf(address);
    return ethers.formatUnits(balance, 6);
  } catch (error) {
    console.error("Erreur balance USDT:", error);
    return "0";
  }
};

// Envoyer ETH
export const sendEth = async (privateKey, toAddress, amountEth) => {
  const provider = await getWorkingProvider();
  const wallet = new ethers.Wallet(privateKey, provider);

  const tx = await wallet.sendTransaction({
    to: toAddress,
    value: ethers.parseEther(amountEth),
  });

  await tx.wait();
  return tx.hash;
};

// Envoyer USDT
export const sendUsdt = async (privateKey, toAddress, amountUsdt) => {
  const network = getCurrentNetwork();

  if (network.chainId !== 1) {
    throw new Error("USDT est disponible uniquement sur Ethereum Mainnet");
  }

  const provider = await getWorkingProvider();
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(USDT_CONTRACT, USDT_ABI, wallet);

  const amount = ethers.parseUnits(amountUsdt, 6);
  const tx = await contract.transfer(toAddress, amount);
  await tx.wait();
  return tx.hash;
};
