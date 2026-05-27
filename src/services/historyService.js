const HISTORY_KEY = "sangowallet_history";

const readHistory = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeHistory = (history) => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

export const addTransactionHistory = (transaction) => {
  const history = readHistory();
  const nextHistory = [
    {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      direction: "sent",
      ...transaction,
    },
    ...history,
  ];

  writeHistory(nextHistory);
  return nextHistory[0];
};

export const getTransactionHistory = () => readHistory();

export const getTransactionHistoryForCrypto = (symbol) =>
  readHistory().filter(
    (transaction) =>
      transaction.symbol?.toUpperCase() === symbol?.toUpperCase(),
  );
