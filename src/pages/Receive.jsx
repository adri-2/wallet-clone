import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSessionWallet } from "../services/encryptionService";
import { QRCodeSVG } from "qrcode.react";

export default function Receive() {
  const [walletData, setWalletData] = useState(getSessionWallet());
  const [selectedCrypto, setSelectedCrypto] = useState("ETH");
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const syncSession = () => {
      const sessionWallet = getSessionWallet();
      setWalletData(sessionWallet);

      if (!sessionWallet) {
        navigate("/dashboard", { replace: true });
      }
    };

    window.addEventListener("sangowallet-session-change", syncSession);

    return () => {
      window.removeEventListener("sangowallet-session-change", syncSession);
    };
  }, [navigate]);

  if (!walletData) {
    navigate("/dashboard");
    return null;
  }

  const getCurrentAddress = () => {
    switch (selectedCrypto) {
      case "BTC":
        return walletData.btcAddress;
      case "ETH":
        return walletData.ethAddress;
      case "SOL":
        return walletData.solAddress;
      default:
        return walletData.ethAddress;
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(getCurrentAddress());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 p-4 pb-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-center"> Recevoir</h1>

      <div className="flex flex-col gap-4">
        {/* Sélection de la crypto */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Crypto
          </label>
          <select
            value={selectedCrypto}
            onChange={(e) => setSelectedCrypto(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50"
          >
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ETH)</option>
            <option value="USDT">Tether (USDT) - ERC20</option>
            <option value="SOL">Solana (SOL)</option>
          </select>
        </div>

        {/* QR CODE */}
        <div className="flex flex-col items-center justify-center bg-white p-4 rounded-xl border-2 border-violet-200">
          <p className="text-sm text-gray-500 mb-3">Scannez ce QR code</p>
          {/* <div className="bg-white p-3 rounded-xl shadow-md"> */}
          <QRCodeSVG
            value={getCurrentAddress() || ""}
            size={220}
            level="H"
            includeMargin={true}
          />
          {/* </div> */}
          <p className="text-xs text-gray-400 mt-3">
            {selectedCrypto} - Adresse de réception
          </p>
        </div>

        {/* Adresse et bouton copier */}
        <div className="bg-linear-to-r from-violet-50 to-pink-50 border border-violet-200 p-4 rounded-lg">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Votre adresse :
          </p>
          <p className="font-mono text-xs break-all bg-white p-3 rounded border border-gray-200 mb-4">
            {getCurrentAddress()}
          </p>
          <button
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 rounded-lg transition"
            onClick={copyAddress}
          >
            {copied ? " Copié !" : " Copier l'adresse"}
          </button>
        </div>

        {/* Bouton retour */}
        <button
          className="w-full bg-gray-200 hover:bg-gray-300 text-black font-bold py-3 rounded-lg transition"
          onClick={() => navigate("/dashboard")}
        >
          ← Retour
        </button>
      </div>
    </div>
  );
}
