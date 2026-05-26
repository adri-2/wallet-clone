import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deriveAllWallets,
  validateSeedPhrase,
} from "../services/walletService";
import { saveWallet, setSessionWallet } from "../services/encryptionService";

export default function ImportWallet() {
  const [seedInput, setSeedInput] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleImport = () => {
    if (!validateSeedPhrase(seedInput)) {
      setError("Veuillez entrer exactement 12 mots");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères");
      return;
    }

    try {
      const wallets = deriveAllWallets(seedInput);
      const walletData = {
        seedPhrase: seedInput,
        ...wallets,
        importedAt: new Date().toISOString(),
      };

      saveWallet(walletData, password);
      setSessionWallet(walletData);
      navigate("/dashboard");
    } catch {
      setError("Seed phrase invalide");
    }
  };

  return (
    <div
      className="flex items-center
        justify-center
        min-h-screen
        bg-violet-500
        p-4
      "
    >
      <div
        className="
          w-full
          max-w-md
          bg-white
          rounded-xl
          shadow-lg
          p-6
        "
      >
        <h1
          className="
            text-2xl
            font-bold
            text-center
            mb-6
          "
        >
          🔑 Importer un wallet
        </h1>

        <textarea
          rows={4}
          placeholder="Collez vos 12 mots ici..."
          value={seedInput}
          onChange={(e) => setSeedInput(e.target.value)}
          className="border p-3 rounded w-full font-mono mb-3"
        />

        <input
          type="password"
          placeholder="Nouveau mot de passe wallet"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-3 rounded w-full mb-3"
        />

        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-3">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            className="bg-violet-500 hover:bg-violet-600 text-white font-bold py-2 px-4 rounded-lg flex-1"
            onClick={handleImport}
          >
            Restaurer mon wallet
          </button>

          <button
            className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded-lg"
            onClick={() => navigate("/create")}
          >
            Créer
          </button>
        </div>
      </div>
    </div>
  );
}
