import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  LogOut,
  PlusCircle,
  Wallet,
  X,
} from "lucide-react";

export default function WalletMenu({
  open,
  wallets,
  currentWallet,
  walletIndex,
  onClose,
  onPrevious,
  onNext,
  onSelectWallet,
  onLogout,
}) {
  const navigate = useNavigate();
  const [swipeStartX, setSwipeStartX] = useState(null);

  if (!open) {
    return null;
  }

  const handleSwipeStart = (clientX) => {
    setSwipeStartX(clientX);
  };

  const handleSwipeEnd = (clientX) => {
    if (swipeStartX === null || wallets.length <= 1) return;

    const deltaX = clientX - swipeStartX;
    if (Math.abs(deltaX) < 40) {
      setSwipeStartX(null);
      return;
    }

    if (deltaX < 0) {
      onNext();
    } else {
      onPrevious();
    }

    setSwipeStartX(null);
  };

  return (
    <div className="absolute inset-0 z-20 bg-black/30 backdrop-blur-sm">
      <div className="absolute inset-x-0 top-0 mx-auto mt-4 w-[92%] max-w-md overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-violet-700" />
            <h2 className="text-lg font-bold text-gray-900">Mes wallets</h2>
          </div>
          <button
            className="cursor-pointer rounded-full p-2 text-gray-600 transition hover:bg-gray-100"
            onClick={onClose}
            aria-label="Fermer le menu wallets"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-3">
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-3 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
              onClick={() => {
                onClose();
                navigate("/create");
              }}
            >
              <PlusCircle className="h-4 w-4" />
              Créer
            </button>
            <button
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              onClick={() => {
                onClose();
                navigate("/import");
              }}
            >
              <Wallet className="h-4 w-4" />
              Importer
            </button>
          </div>

          <div
            className="rounded-2xl bg-linear-to-br from-violet-600 to-fuchsia-500 p-4 text-white shadow-lg"
            onTouchStart={(event) => handleSwipeStart(event.touches[0].clientX)}
            onTouchEnd={(event) =>
              handleSwipeEnd(event.changedTouches[0].clientX)
            }
            onMouseDown={(event) => handleSwipeStart(event.clientX)}
            onMouseUp={(event) => handleSwipeEnd(event.clientX)}
          >
            <div className="flex items-center justify-between text-sm opacity-90">
              <span>
                {wallets.length
                  ? `${walletIndex + 1} / ${wallets.length}`
                  : "Aucun wallet"}
              </span>
              <ArrowLeftRight className="h-4 w-4" />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                className="cursor-pointer rounded-full bg-white/15 p-2 transition hover:bg-white/25 disabled:opacity-40"
                onClick={onPrevious}
                disabled={wallets.length <= 1}
                aria-label="Wallet précédent"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1 text-center">
                <p className="truncate text-lg font-semibold">
                  {currentWallet?.name || "Wallet actif"}
                </p>
                <p className="truncate text-xs opacity-90">
                  {(
                    currentWallet?.ethAddress ||
                    currentWallet?.address ||
                    ""
                  ).slice(0, 18)}
                  ...
                </p>
              </div>

              <button
                className="cursor-pointer rounded-full bg-white/15 p-2 transition hover:bg-white/25 disabled:opacity-40"
                onClick={onNext}
                disabled={wallets.length <= 1}
                aria-label="Wallet suivant"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-center text-xs opacity-85">
              Glissez à gauche ou à droite pour changer de wallet
            </p>
          </div>

          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
            {wallets.map((wallet, index) => {
              const isActive = currentWallet?.id === wallet.id;
              return (
                <button
                  key={wallet.id}
                  className={`cursor-pointer flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    isActive
                      ? "border-violet-500 bg-violet-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => onSelectWallet(wallet.id, index)}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">
                      {wallet.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {(wallet.ethAddress || wallet.address || "").slice(0, 18)}
                      ...
                    </p>
                  </div>
                  {isActive && (
                    <span className="rounded-full bg-violet-600 px-2 py-1 text-xs font-semibold text-white">
                      Actif
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3 font-semibold text-white transition hover:bg-red-600"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}
