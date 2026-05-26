import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadWallet,
  getSessionWallet,
  setSessionWallet,
  clearSession,
} from "../services/encryptionService";
import { getEthBalance, getUsdtBalance } from "../services/ethService";
import { getSolBalance } from "../services/solService";

export default function Dashboard() {
  const [walletData, setWalletData] = useState(() => getSessionWallet());
  const [balances, setBalances] = useState({});
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState("eth");
  const navigate = useNavigate();

  const handleUnlock = async () => {
    setLoading(true);
    const data = loadWallet(password);
    if (!data) {
      setError("Mot de passe incorrect");
      setLoading(false);
      return;
    }
    setWalletData(data);
    setSessionWallet(data);
    await fetchBalances(data);
    setLoading(false);
  };

  const fetchBalances = async (data) => {
    try {
      const [eth, usdt, sol] = await Promise.all([
        getEthBalance(data.ethAddress),
        getUsdtBalance(data.ethAddress),
        getSolBalance(data.solAddress),
      ]);

      setBalances({ eth, usdt, sol, btc: "0" });
    } catch (err) {
      console.error("Erreur chargement balances", err);
    }
  };

  useEffect(() => {
    if (walletData) {
      void fetchBalances(walletData);
    }
  }, [walletData]);

  if (!walletData) {
    return (
      // <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-3 m-4 flex flex-col gap-4 justify-center items-stretch">
        <h1 className="text-2xl text-center mb-3 font-bold text-linear-to-br from-violet-500 to-pink-400">
          {" "}
          SANGOWALLET
        </h1>
        <div className="flex flex-col gap-3 justify-between  p-3">
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-4 py-2 bg-gray-200"
            onKeyPress={(e) => e.key === "Enter" && handleUnlock()}
          />
          {error && <div className="error">{error}</div>}
          <button
            className="px-4 py-2 bg-violet-600 text-white hover:bg-violet-700 cursor-pointer"
            onClick={handleUnlock}
            disabled={loading}
          >
            {loading ? "Déverrouillage..." : "Déverrouiller"}
          </button>
          <button
            className="px-4 py-2 bg-gray-300 text-black hover:bg-gray-400 cursor-pointer"
            onClick={() => navigate("/create")}
          >
            Créer un nouveau wallet
          </button>
          <button
            className="px-4 py-2 bg-violet-600 text-white hover:bg-violet-700 cursor-pointer"
            onClick={() => navigate("/import")}
          >
            Importer un wallet
          </button>
        </div>
      </div>
      // </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 justify-center  ">
      <div className="p-2">
        <div className="flex gap-2 justify-between ">
          {/* <button
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-xl"
            onClick={() => {
              clearSession();
              setWalletData(null);
              setBalances({});
              setPassword("");
              setError("");
            }}
          >
            Déconnexion
          </button> */}
          <select
            name=""
            id=""
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="border border-gray-300 rounded px-4 py-1 outline-none focus:ring-2 focus:ring-violet-600"
          >
            <option value="eth">Etherum</option>
            <option value="btc">Bitcoin</option>
            <option value="sol">Solana</option>
            <option value="usdt">Tether USDT</option>
          </select>
        </div>

        <div className="m-4 flex gap-2 flex-col justify-center items-center">
          {selected === "btc" && (
            <div className="m-1 flex gap-2 flex-col justify-center items-center">
              <h3 className="font-bold text-xl flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="60"
                  width="60"
                  viewBox="0 0 640 640"
                >
                  <path
                    fill="rgb(255, 212, 59)"
                    d="M72 320C72 183 183 72 320 72C457 72 568 183 568 320C568 457 457 568 320 568C183 568 72 457 72 320zM426.3 284.7C431.2 251.7 406.1 234 371.7 222.1L382.8 177.4L355.6 170.6L344.7 214.1C337.5 212.3 330.2 210.6 322.9 209L333.8 165.2L306.6 158.4L295.4 203.1C289.5 201.8 283.7 200.4 278 199L278 198.9L240.5 189.5L233.3 218.6C233.3 218.6 253.5 223.2 253.1 223.5C264.1 226.3 266.1 233.5 265.8 239.3L253.1 290.2C253.9 290.4 254.8 290.7 255.9 291.1C255 290.9 254 290.6 253 290.4L235.2 361.7C233.9 365 230.4 370.1 222.7 368.2C223 368.6 202.9 363.3 202.9 363.3L189.4 394.4L224.8 403.2C231.4 404.9 237.8 406.6 244.2 408.2L232.9 453.4L260.1 460.2L271.3 415.5C278.5 417.5 285.7 419.3 293 421.1L281.9 465.6L309.1 472.4L320.4 427.3C366.8 436.1 401.7 432.5 416.4 390.6C428.2 356.8 415.8 337.3 391.4 324.6C409.2 320.5 422.6 308.8 426.1 284.7zM364.1 371.9C355.7 405.7 298.8 387.4 280.3 382.8L295.2 322.9C313.6 327.5 372.8 336.6 364 371.9zM372.5 284.2C364.8 314.9 317.5 299.3 302.1 295.5L315.6 241.2C331 245 380.4 252.2 372.4 284.2z"
                  />
                </svg>
                Bitcoin (BTC)
              </h3>
              <p className="font-bold text-2xl">{balances.btc} BTC</p>
              <small className="font-bold ">
                {walletData.btcAddress?.slice(0, 20)}...
              </small>
            </div>
          )}

          {selected === "eth" && (
            <div className="m-1 flex gap-2 flex-col justify-center items-center">
              <h3 className="font-bold text-xl flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="60"
                  width="60"
                  viewBox="0 0 640 640"
                >
                  <path d="M471.9 324.8L320 417.6L168 324.8L320 64L471.9 324.8zM320 447.4L168 354.6L320 576L472 354.6L320 447.4z" />
                </svg>{" "}
                Ethereum (ETH)
              </h3>
              <p className="font-bold text-2xl">
                {parseFloat(balances.eth).toFixed(4)} ETH
              </p>
              <small className="font-bold ">
                {walletData.ethAddress?.slice(0, 20)}...
              </small>
            </div>
          )}

          {selected === "usdt" && (
            <div className="m-1 flex gap-2 flex-col justify-center items-center">
              <h3 className="font-bold text-xl flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="60"
                  width="60"
                  viewBox="0 0 640 640"
                >
                  <path d="M296 88C296 74.7 306.7 64 320 64C333.3 64 344 74.7 344 88L344 128L400 128C417.7 128 432 142.3 432 160C432 177.7 417.7 192 400 192L285.1 192C260.2 192 240 212.2 240 237.1C240 259.6 256.5 278.6 278.7 281.8L370.3 294.9C424.1 302.6 464 348.6 464 402.9C464 463.2 415.1 512 354.9 512L344 512L344 552C344 565.3 333.3 576 320 576C306.7 576 296 565.3 296 552L296 512L224 512C206.3 512 192 497.7 192 480C192 462.3 206.3 448 224 448L354.9 448C379.8 448 400 427.8 400 402.9C400 380.4 383.5 361.4 361.3 358.2L269.7 345.1C215.9 337.5 176 291.4 176 237.1C176 176.9 224.9 128 285.1 128L296 128L296 88z" />
                </svg>
                Tether (USDT)
              </h3>
              <p className="font-bold text-2xl">
                {parseFloat(balances.usdt).toFixed(2)} USDT
              </p>
              <small>ERC20</small>
            </div>
          )}

          {selected === "sol" && (
            <div className="m-1 flex gap-2 flex-col justify-center items-center">
              <h3 className="font-bold text-xl flex items-center gap-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="60"
                  width="60"
                  viewBox="0 0 640 640"
                >
                  <path d="M574.5 449.2L489.6 537.9C487.8 539.8 485.5 541.4 483 542.4C480.5 543.4 477.8 544 475.1 544L72.9 544C71 544 69.1 543.5 67.5 542.4C65.9 541.3 64.6 539.9 63.9 538.2C63.2 536.5 62.9 534.6 63.2 532.7C63.5 530.8 64.4 529.1 65.7 527.8L150.6 439.1C152.4 437.2 154.7 435.6 157.1 434.6C159.5 433.6 162.2 433 164.9 433L567.3 433C569.2 433 571.1 433.5 572.7 434.6C574.3 435.7 575.6 437.1 576.3 438.8C577 440.5 577.3 442.4 577 444.3C576.7 446.2 575.8 447.9 574.5 449.2zM489.7 270.6C487.9 268.7 485.6 267.1 483.1 266.1C480.6 265.1 477.9 264.5 475.2 264.5L72.8 264.5C70.9 264.5 69 265 67.4 266.1C65.8 267.2 64.5 268.6 63.8 270.3C63.1 272 62.8 273.9 63.1 275.8C63.4 277.7 64.3 279.4 65.6 280.7L150.5 369.4C152.3 371.3 154.6 372.9 157 373.9C159.4 374.9 162.1 375.5 164.8 375.5L567.2 375.5C569.1 375.5 571 375 572.6 373.9C574.2 372.8 575.5 371.4 576.2 369.7C576.9 368 577.2 366.1 576.9 364.2C576.6 362.3 575.7 360.6 574.4 359.3L489.5 270.6zM72.9 206.9L475.3 206.9C478 206.9 480.7 206.4 483.2 205.3C485.7 204.2 487.9 202.7 489.8 200.8L574.7 112.1C576 110.7 576.9 109 577.2 107.2C577.5 105.4 577.3 103.5 576.5 101.7C575.7 99.9 574.5 98.5 572.9 97.5C571.3 96.5 569.4 95.9 567.5 95.9L165 96C162.3 96 159.6 96.5 157.2 97.6C154.8 98.7 152.5 100.2 150.7 102.1L65.7 190.8C64.4 192.2 63.5 193.9 63.2 195.7C62.9 197.5 63.1 199.4 63.9 201.2C64.7 203 65.9 204.4 67.5 205.4C69.1 206.4 71 207 72.9 207z" />
                </svg>{" "}
                Solana (SOL)
              </h3>
              <p className="font-bold text-2xl">
                {parseFloat(balances.sol).toFixed(4)} SOL
              </p>
              <small className="font-bold ">
                {walletData.solAddress?.slice(0, 20)}...
              </small>
            </div>
          )}
        </div>

        <div className="flex justify-around">
          <button
            className="bg-violet-700 hover:bg-violet-800 px-5 font-black py-3 rounded text-white cursor-pointer"
            onClick={() => navigate("/send")}
          >
            Envoyer
          </button>
          <button
            className="bg-violet-700 hover:bg-violet-800 px-5 font-black py-3 rounded text-white cursor-pointer"
            onClick={() => navigate("/receive")}
          >
            Recevoir
          </button>
        </div>
      </div>
    </div>
  );
}
