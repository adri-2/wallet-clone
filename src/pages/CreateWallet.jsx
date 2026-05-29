import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  generateSeedPhrase,
  deriveAllWallets,
} from "../services/walletService";

import {
  saveWallet,
  setSessionWallet,
  setSessionPassword,
  getSessionPassword,
} from "../services/encryptionService";

export default function CreateWallet() {
  const [step, setStep] = useState(1);

  const [seedPhrase, setSeedPhrase] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");

  const navigate = useNavigate();
  const masterPassword = getSessionPassword();
  const needsPassword = !masterPassword;

  // =========================
  // STEP 1
  // =========================

  const handleGenerateSeed = () => {
    const newSeed = generateSeedPhrase();

    setSeedPhrase(newSeed);

    setError("");

    setStep(2);
  };

  // =========================
  // STEP 3 SAVE WALLET
  // =========================

  const handleSaveWallet = () => {
    setError("");

    const normalizedSeedPhrase = seedPhrase.trim();

    const effectivePassword = masterPassword || password;

    // Validation
    if (!effectivePassword) {
      setError("Définissez un mot de passe maître pour continuer");

      return;
    }

    if (!masterPassword && password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");

      return;
    }

    if (!masterPassword && password.length < 6) {
      setError("Minimum 6 caractères");

      return;
    }

    try {
      const wallets = deriveAllWallets(normalizedSeedPhrase);

      const walletData = {
        seedPhrase: normalizedSeedPhrase,
        address: wallets.ethAddress,

        ...wallets,

        createdAt: new Date().toISOString(),
      };

      const result = saveWallet(walletData, effectivePassword);

      if (!result.success) {
        setError(result.message || "Erreur création wallet");

        return;
      }

      setSessionWallet({
        ...walletData,
        ...result.wallet,
      });
      setSessionPassword(effectivePassword);

      navigate("/dashboard");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Erreur création wallet",
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 pb-8">
      <h1 className="text-3xl font-bold text-center bg-linear-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">
        SANGO WALLET
      </h1>

      <div className="flex justify-center gap-2">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition ${
              step >= item ? "bg-violet-600" : "bg-gray-300"
            }`}
          >
            {item}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-4 items-center">
          <p className="text-center text-gray-700">
            Bienvenue sur SANGOWALLET. Créez un wallet multi-blockchain
            sécurisé.
          </p>
          <button
            onClick={handleGenerateSeed}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg transition"
          >
            Générer les 12 mots
          </button>
          <button
            onClick={() => navigate("/import")}
            className="w-full bg-gray-200 hover:bg-gray-300 text-black font-bold py-3 rounded-lg transition"
          >
            Importer les 12 mots
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-center">
            Sauvegardez vos 12 mots
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {seedPhrase.split(" ").map((word, index) => (
              <div
                key={index}
                className="bg-gray-100 p-3 rounded text-center font-mono text-sm border border-gray-200"
              >
                <div className="text-xs text-gray-500">{index + 1}</div>
                <div className="font-bold">{word}</div>
              </div>
            ))}
          </div>
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-sm">
            ⚠️ Ne partagez jamais ces mots. Ils permettent d’accéder à vos
            cryptos.
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-black py-3 rounded-lg font-semibold transition"
            >
              Retour
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg font-semibold transition"
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-center">Sécuriser le wallet</h2>
          {masterPassword ? (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg text-sm">
              Le mot de passe maître est déjà défini. Il sera utilisé pour ce
              wallet.
            </div>
          ) : (
            <>
              <input
                type="password"
                placeholder="Mot de passe maître"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-300 p-3 rounded-lg bg-gray-50"
                disabled={!needsPassword}
              />
              <input
                type="password"
                placeholder="Confirmer mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border border-gray-300 p-3 rounded-lg bg-gray-50"
                disabled={!needsPassword}
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
              onClick={() => setStep(2)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-black py-3 rounded-lg font-semibold transition"
            >
              Retour
            </button>
            <button
              onClick={handleSaveWallet}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition"
            >
              Créer Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
