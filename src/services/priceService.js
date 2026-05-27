export async function getCryptoPrices() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,tether&vs_currencies=usd",
    );
    const data = await response.json();
    return {
      btc: data.bitcoin.usd,
      eth: data.ethereum.usd,
      sol: data.solana.usd,
      usdt: data.tether.usd,
    };
  } catch (error) {
    console.error("Erreur recuperation prix :", error);
    return {
      btc: 0,
      eth: 0,
      sol: 0,
      usdt: 0,
    };
  }
}
