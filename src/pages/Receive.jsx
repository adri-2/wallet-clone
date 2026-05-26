import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSessionWallet } from "../services/encryptionService";
// import QRCode from "qrcode.react";

export default function Receive() {
  const [walletData, setWalletData] = useState(getSessionWallet());
  const [selectedCrypto, setSelectedCrypto] = useState("ETH");
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

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
    <div className="container">
      <div className="card">
        <h1>📥 Recevoir des cryptos</h1>

        <select
          value={selectedCrypto}
          onChange={(e) => setSelectedCrypto(e.target.value)}
          className="input-field"
        >
          <option value="BTC">Bitcoin (BTC)</option>
          <option value="ETH">Ethereum (ETH)</option>
          <option value="USDT">Tether (USDT) - ERC20</option>
          <option value="SOL">Solana (SOL)</option>
        </select>

        {/* <div className="qrcode-container">
          <QRCode value={getCurrentAddress()} size={200} />
        </div> */}

        <div className="address-box">
          <p className="address-label">Votre adresse :</p>
          <p className="address">{getCurrentAddress()}</p>
          <button className="btn-secondary" onClick={copyAddress}>
            {copied ? "✅ Copié !" : "📋 Copier l'adresse"}
          </button>
        </div>

        <button
          className="btn-secondary"
          onClick={() => navigate("/dashboard")}
        >
          Retour
        </button>
      </div>
    </div>
  );
}
