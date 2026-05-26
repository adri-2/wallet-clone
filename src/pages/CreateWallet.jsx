import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  generateSeedPhrase,
  deriveAllWallets,
} from "../services/walletService";

import { saveWallet, setSessionWallet } from "../services/encryptionService";

export default function CreateWallet() {
  const [step, setStep] = useState(1);

  const [seedPhrase, setSeedPhrase] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");

  const navigate = useNavigate();

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

    // Validation
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");

      return;
    }

    if (password.length < 6) {
      setError("Minimum 6 caractères");

      return;
    }

    try {
      const wallets = deriveAllWallets(seedPhrase);

      const walletData = {
        seedPhrase,

        ...wallets,

        createdAt: new Date().toISOString(),
      };

      saveWallet(walletData, password);
      setSessionWallet(walletData);

      navigate("/dashboard");
    } catch {
      setError("Erreur création wallet");
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
          SANGO WALLET
        </h1>

        {/* ===================== */}
        {/* STEP INDICATOR */}
        {/* ===================== */}

        <div
          className="
            flex
            justify-center
            gap-2
            mb-6
          "
        >
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className={`
                w-8
                h-8
                rounded-full
                flex
                items-center
                justify-center
                text-white
                font-bold

                ${step >= item ? "bg-violet-500" : "bg-gray-300"}
              `}
            >
              {item}
            </div>
          ))}
        </div>

        {/* ===================== */}
        {/* STEP 1 */}
        {/* ===================== */}

        {step === 1 && (
          <div
            className="
              flex
              flex-col
              gap-4
              items-center
            "
          >
            <p className="text-center">
              Bienvenue sur SANGOWALLET. Créez un wallet multi-blockchain
              sécurisé.
            </p>

            <button
              onClick={handleGenerateSeed}
              className="
                bg-violet-500
                hover:bg-violet-600
                text-white
                font-bold
                py-2
                px-7
                rounded-lg
              "
            >
              Générer les 12 mots
            </button>

            <button
              onClick={() => navigate("/import")}
              className="
                bg-violet-500
                hover:bg-violet-600
                text-white
                font-bold
                py-2
                px-6
                rounded-lg
              "
            >
              Importer les 12 mots
            </button>
          </div>
        )}

        {/* ===================== */}
        {/* STEP 2 */}
        {/* ===================== */}

        {step === 2 && (
          <div
            className="
              flex
              flex-col
              gap-4
            "
          >
            <h2
              className="
                text-lg
                font-bold
                text-center
              "
            >
              Sauvegardez vos 12 mots
            </h2>

            <div
              className="
                grid
                grid-cols-3
                gap-2
              "
            >
              {seedPhrase.split(" ").map((word, index) => (
                <div
                  key={index}
                  className="
                    bg-gray-100
                    p-2
                    rounded
                    text-center
                    font-mono
                  "
                >
                  {index + 1}. {word}
                </div>
              ))}
            </div>

            <div
              className="
                bg-yellow-100
                text-yellow-800
                p-3
                rounded
                text-sm
              "
            >
              ⚠️ Ne partagez jamais ces mots. Ils permettent d’accéder à vos
              cryptos.
            </div>

            <div
              className="
                flex
                justify-between
              "
            >
              <button
                onClick={() => setStep(1)}
                className="
                  bg-gray-300
                  px-4
                  py-2
                  rounded
                "
              >
                Retour
              </button>

              <button
                onClick={() => setStep(3)}
                className="
                  bg-violet-500
                  hover:bg-violet-600
                  text-white
                  px-4
                  py-2
                  rounded
                "
              >
                Continuer
              </button>
            </div>
          </div>
        )}

        {/* ===================== */}
        {/* STEP 3 */}
        {/* ===================== */}

        {step === 3 && (
          <div
            className="
              flex
              flex-col
              gap-4
            "
          >
            <h2
              className="
                text-lg
                font-bold
                text-center
              "
            >
              Sécuriser le wallet
            </h2>

            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                border
                p-3
                rounded
              "
            />

            <input
              type="password"
              placeholder="Confirmer mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="
                border
                p-3
                rounded
              "
            />

            {error && (
              <div
                className="
                  bg-red-100
                  text-red-700
                  p-2
                  rounded
                "
              >
                {error}
              </div>
            )}

            <div
              className="
                flex
                justify-between
              "
            >
              <button
                onClick={() => setStep(2)}
                className="
                  bg-gray-300
                  px-4
                  py-2
                  rounded
                "
              >
                Retour
              </button>

              <button
                onClick={handleSaveWallet}
                className="
                  bg-green-500
                  hover:bg-green-600
                  text-white
                  font-bold
                  px-4
                  py-2
                  rounded
                "
              >
                Créer Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
