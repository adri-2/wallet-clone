import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Menu } from "lucide-react";
import CreateWallet from "./pages/CreateWallet";
import ImportWallet from "./pages/ImportWallet";
import Dashboard from "./pages/Dashboard";
import ImportToken from "./pages/ImportToken";
import WalletList from "./pages/WalletList";
import History from "./pages/History";
import Send from "./pages/Send";
import Receive from "./pages/Receive";
import WalletMenu from "./components/WalletMenu";
import {
  getSessionWallet,
  walletExists,
  clearSessionPassword,
  clearSession,
  getSessionPassword,
} from "./services/encryptionService";
import { getAllWallets, switchWallet } from "./services/walletManagerService";

const NavBar = ({ onOpenWalletMenu }) => {
  return (
    <nav className="bg-violet-800 p-4 w-full text-amber-50 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <button
          className="inline-flex cursor-pointer items-center justify-center rounded-full border border-white/20 p-2 transition hover:bg-white/10"
          onClick={onOpenWalletMenu}
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="font-bold text-2xl">Wallet Sango</h1>
      </div>
    </nav>
  );
};

function AppContent() {
  const [isConnected, setIsConnected] = useState(() =>
    Boolean(getSessionWallet()),
  );
  const [hasWallet, setHasWallet] = useState(() => walletExists());
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [activeWallet, setActiveWallet] = useState(() => getSessionWallet());

  const currentWalletIndex = Math.max(
    wallets.findIndex((wallet) => wallet.id === activeWallet?.id),
    0,
  );

  const loadWallets = () => {
    const password = getSessionPassword();
    if (!password) {
      setWallets([]);
      return;
    }

    const loadedWallets = getAllWallets(password);
    if (!loadedWallets || loadedWallets.length === 0) {
      setWallets([]);
      return;
    }

    setWallets(loadedWallets);
  };

  useEffect(() => {
    const syncSession = () => {
      const sessionWallet = getSessionWallet();
      setIsConnected(Boolean(sessionWallet));
      setActiveWallet(sessionWallet);
      setHasWallet(walletExists());
      if (sessionWallet) {
        loadWallets();
      }
    };

    const handleWalletChanged = (event) => {
      const { wallet } = event.detail || {};
      if (wallet) {
        setActiveWallet(wallet);
        loadWallets();
      }
    };

    window.addEventListener("sangowallet-session-change", syncSession);
    window.addEventListener("sangowallet-wallet-changed", handleWalletChanged);
    syncSession();

    return () => {
      window.removeEventListener("sangowallet-session-change", syncSession);
      window.removeEventListener("sangowallet-wallet-changed", handleWalletChanged);
    };
  }, []);

  const clampWalletIndex = (nextIndex) => {
    if (!wallets.length) return 0;
    return (nextIndex + wallets.length) % wallets.length;
  };

  const handleSelectWallet = (walletId) => {
    const password = getSessionPassword();
    if (!password) return;

    const switchedWallet = switchWallet(password, walletId);
    if (switchedWallet) {
      setActiveWallet(switchedWallet);
      setWalletMenuOpen(false);
      loadWallets();
    }
  };

  const currentWallet = wallets[currentWalletIndex] || activeWallet;

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
    <div className="min-h-screen bg-linear-to-br from-violet-500 to-pink-400 flex justify-center items-start md:items-center p-2">
      <div className="relative w-full md:max-w-105 bg-white min-h-screen md:min-h-auto md:rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {isConnected && (
          <NavBar
            onOpenWalletMenu={() => {
              setWalletMenuOpen(true);
              loadWallets();
            }}
          />
        )}
        <WalletMenu
          open={walletMenuOpen && isConnected}
          wallets={wallets}
          currentWallet={currentWallet}
          walletIndex={currentWalletIndex}
          onClose={() => setWalletMenuOpen(false)}
          onPrevious={() => {
            const nextIndex = clampWalletIndex(currentWalletIndex - 1);
            const nextWallet = wallets[nextIndex];
            if (nextWallet) {
              handleSelectWallet(nextWallet.id);
            }
          }}
          onNext={() => {
            const nextIndex = clampWalletIndex(currentWalletIndex + 1);
            const nextWallet = wallets[nextIndex];
            if (nextWallet) {
              handleSelectWallet(nextWallet.id);
            }
          }}
          onSelectWallet={(walletId) => {
            handleSelectWallet(walletId);
          }}
          onLogout={() => {
            setWalletMenuOpen(false);
            clearSession();
            clearSessionPassword();
            setIsConnected(false);
            setActiveWallet(null);
            setWallets([]);
            setHasWallet(walletExists());
          }}
        />
        <div className="flex-1 overflow-y-auto">{routes}</div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
