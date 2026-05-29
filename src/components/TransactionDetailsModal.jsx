import { X, ArrowDownLeft, ArrowUpRight } from "lucide-react";

const formatDateTime = (date) =>
  new Date(date).toLocaleString("fr-FR", {
    dateStyle: "full",
    timeStyle: "medium",
  });

const maskAddress = (addr) => {
  if (!addr) return "-";

  const s = String(addr);

  if (s.length <= 14) return s;

  return `${s.slice(0, 8)}...${s.slice(-6)}`;
};

export default function TransactionDetailsModal({
  open,
  onClose,
  transaction,
}) {
  if (!open || !transaction) return null;

  const isReceived = transaction.direction === "received";

  const networkMap = {
    ETH: "Ethereum",
    USDT: "Ethereum ERC20",
    BTC: "Bitcoin",
    SOL: "Solana",
  };

  const network = networkMap[transaction.symbol] || transaction.symbol;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center  bg-black/50 md:items-center overflow-y-auto scrollbar-hidden">
      <div className="w-full max-w-md bg-white rounded-t-3xl md:rounded-3xl p-5 h-[550px] overflow-y-auto scrollbar-hidden  mt-4 animate-in slide-in-from-bottom duration-300">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Détails Transaction</h2>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* STATUS */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isReceived ? "bg-emerald-100" : "bg-violet-100"
            }`}
          >
            {isReceived ? (
              <ArrowDownLeft size={30} className="text-emerald-600" />
            ) : (
              <ArrowUpRight size={30} className="text-violet-600" />
            )}
          </div>

          <h3 className="mt-3 text-2xl font-bold">
            {transaction.amount} {transaction.symbol}
          </h3>

          <span
            className={`mt-2 px-4 py-1 rounded-full text-sm font-semibold ${
              isReceived
                ? "bg-emerald-50 text-emerald-700"
                : "bg-violet-50 text-violet-700"
            }`}
          >
            {isReceived ? "Reçu" : "Envoyé"}
          </span>
        </div>

        {/* DETAILS */}
        <div className="space-y-4">
          {/* DATE */}
          <div className="flex items-start justify-between gap-4 border-b pb-3">
            <p className="text-gray-500">Date & Heure</p>

            <p className="text-right font-medium">
              {formatDateTime(transaction.createdAt)}
            </p>
          </div>

          {/* STATUS */}
          <div className="flex items-center justify-between border-b pb-3">
            <p className="text-gray-500">Statut</p>

            <span className="text-emerald-600 font-semibold">Confirmé</span>
          </div>

          {/* NETWORK */}
          <div className="flex items-center justify-between border-b pb-3">
            <p className="text-gray-500">Réseau</p>

            <p className="font-medium">{network}</p>
          </div>

          {/* FEES */}
          <div className="flex items-center justify-between border-b pb-3">
            <p className="text-gray-500">Frais réseau</p>

            <p className="font-medium">
              {transaction.fee || "0.0001"} {transaction.symbol}
            </p>
          </div>

          {/* FROM / TO */}
          {isReceived ? (
            <div className="flex items-start justify-between gap-4 border-b pb-3">
              <p className="text-gray-500">De</p>

              <p className="text-right font-medium break-all">
                {maskAddress(transaction.from || transaction.fromAddress)}
              </p>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4 border-b pb-3">
              <p className="text-gray-500">À</p>

              <p className="text-right font-medium break-all">
                {maskAddress(transaction.to || transaction.toAddress)}
              </p>
            </div>
          )}

          {/* HASH */}
          <div className="flex items-start justify-between gap-4">
            <p className="text-gray-500">Hash</p>

            <p className="text-right font-medium break-all text-sm">
              {transaction.hash || "-"}
            </p>
          </div>
        </div>

        {/* BUTTON */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
