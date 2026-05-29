import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Globe, Search, Upload } from "lucide-react";
import { getActiveWalletFromSession } from "../services/walletManagerService";
import { getCurrentNetwork } from "../services/networkService";
import { fetchTokenInfo, saveToken } from "../services/tokenService";

export default function ImportToken() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenLogo, setTokenLogo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tokenInfo, setTokenInfo] = useState(null);
  const [step, setStep] = useState(1);

  const navigate = useNavigate();
  const walletData = getActiveWalletFromSession();
  const currentNetwork = getCurrentNetwork();

  const handleFetchToken = async () => {
    if (!tokenAddress || tokenAddress.length !== 42) {
      setError("Adresse de contrat invalide (doit commencer par 0x...)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const info = await fetchTokenInfo(tokenAddress);
      setTokenInfo({
        ...info,
        logo: tokenLogo.trim() || info.logo || "",
      });
      setStep(2);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  const handleImport = async () => {
    setLoading(true);

    const saved = saveToken(
      walletData.ethAddress,
      currentNetwork.id,
      tokenInfo,
    );

    if (saved) {
      alert(` Token ${tokenInfo.symbol} ajouté avec succès !`);
      navigate("/dashboard");
    } else {
      setError("Ce token est déjà dans votre liste");
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2 text-gray-700 transition hover:bg-gray-100"
          aria-label="Retour au tableau de bord"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Importer un token</h1>
      </div>

      <div className="bg-blue-50 p-3 rounded-lg text-sm flex items-start gap-2">
        <Globe className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <div>
          Réseau actuel: <strong>{currentNetwork.name}</strong>
          <p className="text-xs text-gray-600 mt-1">
            Les tokens importés sont spécifiques à ce réseau
          </p>
        </div>
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Adresse du contrat token (ERC20)
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="w-full border p-3 rounded-lg font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Exemple: 0xdAC17F958D2ee523a2206206994597C13D831ec7 (USDT)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Logo du token (optionnel)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={tokenLogo}
              onChange={(e) => setTokenLogo(e.target.value)}
              className="w-full border p-3 rounded-lg text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Laissez vide si vous voulez utiliser le logo par défaut.
            </p>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleFetchToken}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-violet-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? (
              <Search className="h-4 w-4 animate-pulse" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {loading ? "Vérification..." : "Vérifier le token"}
          </button>
        </div>
      )}

      {step === 2 && tokenInfo && (
        <div className="flex flex-col gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-bold text-green-800 mb-3 inline-flex items-center gap-2">
              <BadgeCheck className="h-5 w-5" />
              Token trouvé !
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Nom:</span>
                <span className="font-medium">{tokenInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Symbole:</span>
                <span className="font-medium">{tokenInfo.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Décimales:</span>
                <span className="font-medium">{tokenInfo.decimals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Réseau:</span>
                <span className="font-medium">{currentNetwork.name}</span>
              </div>
              <div className="mt-2">
                <p className="text-gray-600 text-sm mb-1">Adresse:</p>
                <p className="font-mono text-xs break-all bg-gray-100 p-2 rounded">
                  {tokenInfo.address}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleImport}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-medium"
          >
            <Upload className="h-4 w-4" />
            {loading ? "Import..." : "Importer ce token"}
          </button>

          <button
            onClick={() => {
              setStep(1);
              setTokenInfo(null);
              setTokenAddress("");
              setTokenLogo("");
            }}
            className="inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-800 py-2 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
        </div>
      )}
    </div>
  );
}
