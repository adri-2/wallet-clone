import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAllWallets,
  deleteWallet,
  getActiveWalletFromSession,
  renameWallet,
} from "../services/walletManagerService";

export default function WalletList() {
  const [wallets, setWallets] = useState([]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(null);
  const [editingWalletId, setEditingWalletId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const navigate = useNavigate();

  const loadWallets = () => {
    if (!password) return;

    setLoading(true);
    const walletList = getAllWallets(password);
    if (walletList === null || walletList.length === 0) {
      setError("Mot de passe incorrect ou aucun wallet");
      setWallets([]);
    } else {
      setWallets(walletList);
      setError("");
    }
    setLoading(false);
  };

  const handleDeleteWallet = (walletId) => {
    if (window.confirm("Supprimer définitivement ce wallet ?")) {
      deleteWallet(password, walletId);
      loadWallets(); // Rafraîchir la liste
      setShowDelete(null);
    }
  };

  const startRename = (wallet) => {
    setEditingWalletId(wallet.id);
    setEditingName(wallet.name || "");
    setShowDelete(null);
  };

  const handleRenameWallet = (walletId) => {
    const result = renameWallet(walletId, editingName);

    if (!result.success) {
      setError(result.message || "Impossible de renommer le wallet");
      return;
    }

    setEditingWalletId(null);
    setEditingName("");
    setError("");
    loadWallets();
  };

  // Récupérer le wallet actif pour le mettre en évidence
  const activeWallet = getActiveWalletFromSession();

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center">🔐 Mes wallets</h1>

      {wallets.length === 0 && !error && (
        <div className="text-center">
          <input
            type="password"
            placeholder="Mot de passe maître"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded w-full mb-2"
          />
          <button
            className="bg-violet-600 text-white px-6 py-2 rounded w-full"
            onClick={loadWallets}
            disabled={loading}
          >
            {loading ? "Chargement..." : "Charger mes wallets"}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded">{error}</div>
      )}

      {wallets.length > 0 && (
        <>
          <div className="bg-green-100 p-2 rounded text-center text-sm">
            {wallets.length} wallet(s) trouvé(s)
          </div>

          <div className="flex flex-col gap-3">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className={`border rounded-lg p-3 ${
                  activeWallet?.id === wallet.id
                    ? "bg-violet-50 border-violet-500"
                    : "bg-white"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold">{wallet.name}</h3>
                      {activeWallet?.id === wallet.id && (
                        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                          Actif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-mono mt-1">
                      {(wallet.ethAddress || wallet.address || "").slice(0, 16)}
                      ...
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Créé le {new Date(wallet.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => startRename(wallet)}
                      className="bg-violet-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Renommer
                    </button>
                    <button
                      onClick={() =>
                        setShowDelete(
                          showDelete === wallet.id ? null : wallet.id,
                        )
                      }
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {showDelete === wallet.id && (
                  <div className="mt-3 p-2 bg-red-50 rounded">
                    <p className="text-sm text-red-700 mb-2">
                      Supprimer définitivement "{wallet.name}" ?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteWallet(wallet.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Oui, supprimer
                      </button>
                      <button
                        onClick={() => setShowDelete(null)}
                        className="bg-gray-300 px-3 py-1 rounded text-sm"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {editingWalletId === wallet.id && (
                  <div className="mt-3 p-2 bg-violet-50 rounded">
                    <p className="text-sm font-semibold text-violet-700 mb-2">
                      Nouveau nom du wallet
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 border rounded px-3 py-2 text-sm"
                        placeholder="Nom du wallet"
                      />
                      <button
                        onClick={() => handleRenameWallet(wallet.id)}
                        className="bg-violet-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Valider
                      </button>
                      <button
                        onClick={() => {
                          setEditingWalletId(null);
                          setEditingName("");
                        }}
                        className="bg-gray-300 px-3 py-1 rounded text-sm"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              className="flex-1 bg-violet-600 text-white py-2 rounded"
              onClick={() => navigate("/create")}
            >
              + Nouveau wallet
            </button>
            <button
              className="flex-1 bg-gray-500 text-white py-2 rounded"
              onClick={() => navigate("/import")}
            >
              📥 Importer
            </button>
          </div>
        </>
      )}
    </div>
  );
}
