// Talks to the sender's own wallet (Rabby, MetaMask, Trust...) through the standard browser provider.
// We never see the sender's keys: every payment is approved inside their wallet.
import { translate, type Language } from "./i18n";

const BSC = {
  chainId: "0x38",
  chainName: "BNB Smart Chain",
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  rpcUrls: ["https://bsc-dataseed.bnbchain.org"],
  blockExplorerUrls: ["https://bscscan.com"]
};

const provider = (): any => (window as any).ethereum;
export const hasWallet = () => Boolean(provider());

const pad = (hex: string) => hex.replace(/^0x/, "").toLowerCase().padStart(64, "0");
export const encodeTransfer = (to: string, units: bigint) => "0xa9059cbb" + pad(to) + units.toString(16).padStart(64, "0");

async function ensureBsc() {
  const eth = provider();
  if ((await eth.request({ method: "eth_chainId" })) === BSC.chainId) return;
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BSC.chainId }] });
  } catch (e: any) {
    if (e?.code !== 4902) throw e;
    await eth.request({ method: "wallet_addEthereumChain", params: [BSC] });
  }
}

export async function connectWallet(): Promise<string> {
  const eth = provider();
  if (!eth) throw new Error("no_wallet");
  const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
  await ensureBsc();
  return accounts[0];
}

export async function disconnectWallet(): Promise<boolean> {
  const eth = provider();
  if (!eth?.request) return false;
  try {
    await eth.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
    return true;
  } catch {
    return false;
  }
}

export async function sendToken(from: string, token: string, to: string, units: bigint): Promise<string> {
  await ensureBsc();
  return provider().request({ method: "eth_sendTransaction", params: [{ from, to: token, data: encodeTransfer(to, units) }] });
}

export async function sendBnb(from: string, to: string, wei: bigint): Promise<string> {
  await ensureBsc();
  return provider().request({ method: "eth_sendTransaction", params: [{ from, to, value: "0x" + wei.toString(16) }] });
}

export async function waitForReceipt(hash: string, timeoutMs = 300000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await provider().request({ method: "eth_getTransactionReceipt", params: [hash] });
    if (r) {
      if (r.status === "0x0") throw new Error("tx_failed");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error("tx_timeout");
}

export async function tokenBalance(token: string, owner: string): Promise<bigint> {
  const out: string = await provider().request({ method: "eth_call", params: [{ to: token, data: "0x70a08231" + pad(owner) }, "latest"] });
  return BigInt(out || "0x0");
}

export async function bnbBalance(owner: string): Promise<bigint> {
  return BigInt(await provider().request({ method: "eth_getBalance", params: [owner, "latest"] }));
}

export const walletErrorText = (e: any, language: Language = "fa"): string | null => {
  if (e?.code === 4001 || e?.code === "ACTION_REJECTED") return translate(language, "error.cancelled");
  if (e?.message === "no_wallet") return translate(language, "error.noWallet");
  if (e?.message === "tx_failed") return translate(language, "error.txFailed");
  if (e?.message === "tx_timeout") return translate(language, "error.txTimeout");
  if (e?.message === "insufficient_token") return translate(language, "error.insufficient_token");
  if (e?.message === "insufficient_bnb") return translate(language, "error.insufficient_bnb");
  return null;
};
