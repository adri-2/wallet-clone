import {
  getAllWallets as getStoredWallets,
  loadWallet,
  deleteWallet as removeWallet,
  renameWallet as updateWalletName,
  setSessionWallet,
  getSessionWallet,
} from "./encryptionService";

export const getAllWallets = (password) => {
  const wallets = getStoredWallets();

  if (!password) {
    return wallets;
  }

  const decryptedWallets = wallets.map((wallet) => {
    const decrypted = loadWallet(password, wallet.id);

    if (!decrypted) {
      return null;
    }

    return {
      ...wallet,
      ...decrypted,
      createdAt: wallet.createdAt,
    };
  });

  if (decryptedWallets.some((wallet) => wallet === null)) {
    return null;
  }

  return decryptedWallets;
};

export const switchWallet = (password, walletId) => {
  const wallet = loadWallet(password, walletId);

  if (!wallet) {
    return null;
  }

  setSessionWallet(wallet);
  return wallet;
};

export const deleteWallet = (_password, walletId) => {
  removeWallet(walletId);
  return true;
};

export const renameWallet = (walletId, nextName) => {
  return updateWalletName(walletId, nextName);
};

export const getActiveWalletFromSession = () => getSessionWallet();
