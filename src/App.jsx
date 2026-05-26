import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CreateWallet from "./pages/CreateWallet";
import ImportWallet from "./pages/ImportWallet";
import Dashboard from "./pages/Dashboard";
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

  return (
    <BrowserRouter>
      {isConnected ? (
        <div className="min-h-screen sm:p-2 bg-linear-to-br from-violet-500 to-pink-400 flex justify-center ">
          <div className="w-full sm:max-w-[400px] bg-white min-h-screen  sm:min-h-[565px] sm:h-full h-screen shadow-xl sm:rounded ">
            <nav className="bg-violet-800 p-2 w-full  text-amber-50 flex flex-col px-4 justify-center h-full gap-4">
              <h1 className="font-bold text-2xl text-center"> Wallet Sango</h1>

              <div className=" flex items-center justify-between">
                <p className="font-bold"> Account</p>{" "}
                <button
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded cursor-pointer text-white font-bold"
                  onClick={() => {
                    clearSession();
                    setIsConnected(false);
                    setHasWallet(walletExists());
                  }}
                >
                  Déconnexion
                </button>
              </div>
            </nav>

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
          </div>
        </div>
      ) : (
        <div className="min-h-screen sm:p-2 bg-linear-to-br from-violet-500 to-pink-400 flex justify-center ">
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
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;
