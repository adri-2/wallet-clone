import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CreateWallet from "./pages/CreateWallet";
import ImportWallet from "./pages/ImportWallet";
import Dashboard from "./pages/Dashboard";
import ImportToken from "./pages/ImportToken";
import WalletList from "./pages/WalletList";
import History from "./pages/History";
import Send from "./pages/Send";
import Receive from "./pages/Receive";
import {
  getSessionWallet,
  walletExists,
  clearSessionPassword,
  clearSession,
} from "./services/encryptionService";

const NavBar = ({ onLogout }) => {
  return (
    <nav className="bg-violet-800 p-4 w-full text-amber-50 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <h1 className="font-bold text-2xl">Wallet Sango</h1>

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <button
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded cursor-pointer text-white font-bold transition"
          onClick={onLogout}
        >
          Déconnexion
        </button>
      </div>
    </nav>
  );
};

function App() {
  const [isConnected, setIsConnected] = useState(() =>
    Boolean(getSessionWallet()),
  );

  const [hasWallet, setHasWallet] = useState(() => walletExists());

  useEffect(() => {
    const syncSession = () => {
      setIsConnected(Boolean(getSessionWallet()));
      setHasWallet(walletExists());
    };

    window.addEventListener("sangowallet-session-change", syncSession);
    syncSession();

    return () => {
      window.removeEventListener("sangowallet-session-change", syncSession);
    };
  }, []);

  const routes = (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={isConnected || hasWallet ? "/dashboard" : "/create"}
            replace
          />
        }
      />
      <Route path="/create" element={<CreateWallet />} />
      <Route path="/import" element={<ImportWallet />} />
      <Route path="/wallets" element={<WalletList />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/import-token" element={<ImportToken />} />
      <Route path="/history/:symbol" element={<History />} />
      <Route path="/send" element={<Send />} />
      <Route path="/receive" element={<Receive />} />
      <Route
        path="*"
        element={
          <Navigate
            to={isConnected || hasWallet ? "/dashboard" : "/create"}
            replace
          />
        }
      />
    </Routes>
  );

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-linear-to-br from-violet-500 to-pink-400 flex justify-center items-start md:items-center p-2">
        <div className="w-full md:max-w-105 bg-white min-h-screen md:min-h-auto md:rounded-lg shadow-2xl flex flex-col overflow-hidden">
          {isConnected && (
            <NavBar
              onLogout={() => {
                clearSession();
                clearSessionPassword();
                setIsConnected(false);
                setHasWallet(walletExists());
              }}
            />
          )}
          <div className="flex-1 overflow-y-auto">{routes}</div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
