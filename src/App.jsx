import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CreateWallet from "./pages/CreateWallet";
import ImportWallet from "./pages/ImportWallet";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Send from "./pages/Send";
import Receive from "./pages/Receive";
import {
  getSessionWallet,
  walletExists,
  loadWallet,
  setSessionWallet,
  clearSession,
} from "./services/encryptionService";

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

  const NavBar = () => (
    <nav className="bg-violet-800 p-4 w-full text-amber-50 flex items-center justify-between">
      <h1 className="font-bold text-2xl">Wallet Sango</h1>
      <button
        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded cursor-pointer text-white font-bold transition"
        onClick={() => {
          clearSession();
          setIsConnected(false);
          setHasWallet(walletExists());
        }}
      >
        Déconnexion
      </button>
    </nav>
  );

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
      <Route path="/dashboard" element={<Dashboard />} />
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
          {isConnected && <NavBar />}
          <div className="flex-1 overflow-y-auto">{routes}</div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
