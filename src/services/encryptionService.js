import CryptoJS from "crypto-js";

const STORAGE_KEY = "sangowallet_wallets";
const SESSION_KEY = "sangowallet_session";
const SESSION_PASSWORD_KEY = "sangowallet_session_password";
const SESSION_SELECTED_ASSET = "sangowallet_selected_asset";

let sessionWallet = null;
let sessionPassword = null;
let sessionSelectedAsset = null;

const emitSessionChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sangowallet-session-change"));
  }
};

// Charger session au démarrage
if (typeof window !== "undefined") {
  try {
    const storedSession = sessionStorage.getItem(SESSION_KEY);
    sessionWallet = storedSession ? JSON.parse(storedSession) : null;
    sessionPassword = sessionStorage.getItem(SESSION_PASSWORD_KEY);
    sessionSelectedAsset = sessionStorage.getItem(SESSION_SELECTED_ASSET);
  } catch {
    sessionWallet = null;
    sessionPassword = null;
    sessionSelectedAsset = null;
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_PASSWORD_KEY);
  }
}

//
// ===== UTILITAIRE =====
//

const getWallets = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveWallets = (wallets) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
};

const generateWalletId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  const randomPart = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);

  return `${randomPart()}${randomPart()}-${randomPart()}-${randomPart()}-${randomPart()}-${randomPart()}${randomPart()}${randomPart()}`;
};

//
// ===== AJOUTER UN WALLET =====
//

export const saveWallet = (walletData, password) => {
  const wallets = getWallets();
  const primaryAddress =
    walletData.address ||
    walletData.ethAddress ||
    walletData.btcAddress ||
    walletData.solAddress ||
    walletData.primaryAddress ||
    "";

  if (!primaryAddress) {
    return {
      success: false,
      message: "Adresse wallet manquante",
    };
  }

  // Vérifier si wallet existe déjà
  const exists = wallets.find((w) => w.address === primaryAddress);

  if (exists) {
    return {
      success: false,
      message: "Wallet déjà importé",
    };
  }

  // Chiffrer données
  const jsonString = JSON.stringify(walletData);

  const encrypted = CryptoJS.AES.encrypt(jsonString, password).toString();

  const newWallet = {
    id: generateWalletId(),
    name: walletData.name || `Compte ${wallets.length + 1}`,
    address: primaryAddress,
    ethAddress: walletData.ethAddress || primaryAddress,
    btcAddress: walletData.btcAddress || "",
    solAddress: walletData.solAddress || "",
    encryptedData: encrypted,
    createdAt: walletData.createdAt || Date.now(),
  };

  wallets.push(newWallet);

  saveWallets(wallets);

  return {
    success: true,
    wallet: newWallet,
  };
};

//
// ===== CHARGER UN WALLET =====
//

export const loadWallet = (password, walletId = sessionWallet?.id) => {
  const wallets = getWallets();
  const targetWalletId = walletId || sessionWallet?.id || wallets[0]?.id;
  const targetPassword = password;

  if (!targetWalletId || !targetPassword) return null;

  const wallet = wallets.find((w) => w.id === targetWalletId);

  if (!wallet) return null;

  try {
    const bytes = CryptoJS.AES.decrypt(wallet.encryptedData, targetPassword);

    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (!decrypted) return null;

    const parsed = JSON.parse(decrypted);

    return {
      ...parsed,
      id: wallet.id,
      name: wallet.name,
      address: wallet.address,
      ethAddress: parsed.ethAddress || wallet.ethAddress || wallet.address,
      btcAddress: parsed.btcAddress || wallet.btcAddress || "",
      solAddress: parsed.solAddress || wallet.solAddress || "",
      createdAt: wallet.createdAt,
    };
  } catch {
    console.error("Mot de passe incorrect");
    return null;
  }
};

//
// ===== RECUPERER TOUS LES WALLETS =====
//

export const getAllWallets = () => {
  return getWallets();
};

//
// ===== SUPPRIMER UN WALLET =====
//

export const deleteWallet = (walletId) => {
  const wallets = getWallets();

  const updated = wallets.filter((w) => w.id !== walletId);

  saveWallets(updated);

  // Si wallet actif supprimé
  if (sessionWallet?.id === walletId) {
    clearSession();
  }
};

export const renameWallet = (walletId, nextName) => {
  const wallets = getWallets();
  const trimmedName = nextName.trim();

  if (!trimmedName) {
    return {
      success: false,
      message: "Le nom du wallet ne peut pas être vide",
    };
  }

  const updated = wallets.map((wallet) =>
    wallet.id === walletId ? { ...wallet, name: trimmedName } : wallet,
  );

  saveWallets(updated);

  if (sessionWallet?.id === walletId) {
    setSessionWallet({ ...sessionWallet, name: trimmedName });
  }

  return {
    success: true,
  };
};

//
// ===== SESSION =====
//

export const setSessionWallet = (wallet) => {
  sessionWallet = wallet;

  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(wallet));
  }

  emitSessionChange();
};

export const setSessionPassword = (password) => {
  sessionPassword = password;

  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_PASSWORD_KEY, password);
  }

  emitSessionChange();
};

export const setSelectedAsset = (symbol) => {
  sessionSelectedAsset = symbol;

  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_SELECTED_ASSET, symbol);
  }

  emitSessionChange();
};

export const getSelectedAsset = () => {
  return sessionSelectedAsset || "ETH";
};

export const clearSelectedAsset = () => {
  sessionSelectedAsset = null;

  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SESSION_SELECTED_ASSET);
  }

  emitSessionChange();
};

export const getSessionPassword = () => {
  return sessionPassword;
};

export const clearSessionPassword = () => {
  sessionPassword = null;

  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SESSION_PASSWORD_KEY);
  }
};

export const getSessionWallet = () => {
  return sessionWallet;
};

export const clearSession = () => {
  sessionWallet = null;
  clearSessionPassword();

  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SESSION_KEY);
  }

  emitSessionChange();
};

//
// ===== EXISTE ? =====
//

export const walletExists = () => {
  return getWallets().length > 0;
};
