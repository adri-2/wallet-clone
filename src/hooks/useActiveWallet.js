import { useEffect, useState } from "react";
import { getSessionWallet } from "../services/encryptionService";

/**
 * Hook pour synchroniser automatiquement le wallet actif
 * Écoute les événements sangowallet-wallet-changed et met à jour le state
 * @returns {Object} Wallet actif
 */
export const useActiveWallet = () => {
  const [activeWallet, setActiveWallet] = useState(() => getSessionWallet());

  useEffect(() => {
    const handleWalletChanged = (event) => {
      const { wallet } = event.detail || {};
      if (wallet) {
        setActiveWallet(wallet);
      }
    };

    const syncSession = () => {
      setActiveWallet(getSessionWallet());
    };

    window.addEventListener("sangowallet-wallet-changed", handleWalletChanged);
    window.addEventListener("sangowallet-session-change", syncSession);

    return () => {
      window.removeEventListener(
        "sangowallet-wallet-changed",
        handleWalletChanged,
      );
      window.removeEventListener("sangowallet-session-change", syncSession);
    };
  }, []);

  return activeWallet;
};
