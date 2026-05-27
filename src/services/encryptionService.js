import CryptoJS from "crypto-js";

const STORAGE_KEY = "sangowallet_data";
const SESSION_KEY = "sangowallet_session";
let sessionWallet = null;

const emitSessionChange = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sangowallet-session-change"));
  }
};

if (typeof window !== "undefined") {
  try {
    const storedSession = sessionStorage.getItem(SESSION_KEY);
    sessionWallet = storedSession ? JSON.parse(storedSession) : null;
  } catch {
    sessionWallet = null;
    sessionStorage.removeItem(SESSION_KEY);
  }
}

// Sauvegarder wallet chiffré
export const saveWallet = (walletData, password) => {
  const jsonString = JSON.stringify(walletData);
  const encrypted = CryptoJS.AES.encrypt(jsonString, password).toString();
  localStorage.setItem(STORAGE_KEY, encrypted);
  return true;
};

// Charger et déchiffrer wallet
export const loadWallet = (password) => {
  const encrypted = localStorage.getItem(STORAGE_KEY);
  if (!encrypted) return null;

  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, password);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) return null;
    return JSON.parse(decrypted);
  } catch {
    console.error("Mot de passe incorrect");
    return null;
  }
};

// Vérifier si un wallet existe
export const walletExists = () => {
  return localStorage.getItem(STORAGE_KEY) !== null;
};

// Gestion de session
export const setSessionWallet = (walletData) => {
  sessionWallet = walletData;
  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(walletData));
  }
  emitSessionChange();
};

export const getSessionWallet = () => {
  return sessionWallet;
};

export const clearSession = () => {
  sessionWallet = null;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SESSION_KEY);
  }
  emitSessionChange();
};

export const deleteWallet = () => {
  localStorage.removeItem(STORAGE_KEY);
  sessionWallet = null;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(SESSION_KEY);
  }
  emitSessionChange();
};
