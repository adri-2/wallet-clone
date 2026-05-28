import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deriveAllWallets,
  validateSeedPhrase,
} from "../services/walletService";
import {
  saveWallet,
  setSessionWallet,
  setSessionPassword,
  getSessionPassword,
  walletExists,
} from "../services/encryptionService";

export default function ImportWallet() {
  const [seedInput, setSeedInput] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const masterPassword = getSessionPassword();
  const needsInitialPassword = !masterPassword && !walletExists();

  const handleImport = () => {
    if (!validateSeedPhrase(seedInput)) {
      setError("Veuillez entrer exactement 12 mots");
      return;
    }

    const effectivePassword = masterPassword || password;

    if (!effectivePassword) {
      setError("Définissez un mot de passe maître pour continuer");
      return;
    }

    if (!masterPassword && password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères");
      return;
    }

    try {
      const wallets = deriveAllWallets(seedInput);
      const walletData = {
        seedPhrase: seedInput,
        address: wallets.ethAddress,
        ...wallets,
        createdAt: new Date().toISOString(),
      };

      const result = saveWallet(walletData, effectivePassword);

      if (!result.success) {
        setError(result.message || "Erreur import wallet");

        return;
      }

      setSessionWallet({
        ...walletData,
        ...result.wallet,
      });
      setSessionPassword(effectivePassword);
      navigate("/dashboard");
    } catch {
      setError("Seed phrase invalide");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 pb-8">
      <h1 className="text-3xl font-bold text-center">🔑 Importer un wallet</h1>

      <div className="flex flex-col gap-4">
        <textarea
          rows={5}
          placeholder="Collez vos 12 mots ici..."
          value={seedInput}
          onChange={(e) => setSeedInput(e.target.value)}
          className="border border-gray-300 p-3 rounded-lg font-mono bg-gray-50 resize-none"
        />

        {masterPassword ? (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg text-sm">
            Le mot de passe maître actuel sera utilisé pour ce wallet.
          </div>
        ) : (
          <>
            {!needsInitialPassword && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-sm">
                Déverrouille d'abord le dashboard pour réutiliser le mot de
                passe maître existant.
              </div>
            )}
            <input
              type="password"
              placeholder="Mot de passe maître"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg bg-gray-50"
              disabled={!needsInitialPassword}
            />
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg transition"
            onClick={handleImport}
          >
            Restaurer mon wallet
          </button>

          <button
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-black font-bold py-3 rounded-lg transition"
            onClick={() => navigate("/create")}
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  );
}
