// Talks to the sender's own wallet. Two ways to connect:
//  - the browser's own wallet (Rabby, MetaMask... extension or in-app browser), or
//  - WalletConnect, which links a mobile wallet app (this is the one that works inside the Telegram Mini App).
// We never see the sender's keys: every payment is approved inside their wallet.
import { translate, type Language } from "./i18n";

const BSC = {
  chainId: "0x38",
  chainName: "BNB Smart Chain",
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  rpcUrls: ["https://bsc-dataseed.bnbchain.org"],
  blockExplorerUrls: ["https://bscscan.com"]
};

// A WalletConnect (Reown) project id is public by design; it is tied to the allowed domain in the Reown dashboard.
const WC_PROJECT_ID = (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) || "2231447cf6113068177243953288f7a4";

export type WalletKind = "injected" | "walletconnect";

const injected = (): any => (window as any).ethereum;
let wc: any = null; // the WalletConnect provider, created the first time it is needed
let active: any = null; // the provider of the wallet that is connected right now

const provider = (): any => active ?? injected();
export const hasInjectedWallet = () => Boolean(injected());

const pad = (hex: string) => hex.replace(/^0x/, "").toLowerCase().padStart(64, "0");
export const encodeTransfer = (to: string, units: bigint) => "0xa9059cbb" + pad(to) + units.toString(16).padStart(64, "0");

async function ensureBsc(eth: any = provider()) {
  if (eth === wc) return; // a WalletConnect session is opened on BNB Smart Chain only
  if ((await eth.request({ method: "eth_chainId" })) === BSC.chainId) return;
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BSC.chainId }] });
  } catch (e: any) {
    if (e?.code !== 4902) throw e;
    await eth.request({ method: "wallet_addEthereumChain", params: [BSC] });
  }
}

async function walletConnectProvider(): Promise<any> {
  if (wc) return wc;
  const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
  wc = await EthereumProvider.init({
    projectId: WC_PROJECT_ID,
    chains: [56],
    showQrModal: true,
    rpcMap: { 56: BSC.rpcUrls[0] },
    metadata: {
      name: "RAMO Gift Card",
      description: "Crypto gift cards on Telegram",
      url: window.location.origin,
      icons: []
    }
  });
  return wc;
}

export async function connectWallet(kind: WalletKind = injected() ? "injected" : "walletconnect"): Promise<string> {
  if (kind === "injected") {
    const eth = injected();
    if (!eth) throw new Error("no_wallet");
    const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
    await ensureBsc(eth);
    active = eth;
    return accounts[0];
  }
  const prov = await walletConnectProvider();
  if (!prov.session) await prov.connect();
  const account: string | undefined = prov.accounts?.[0];
  if (!account) throw new Error("no_wallet");
  active = prov;
  return account;
}

export async function disconnectWallet(): Promise<boolean> {
  const eth = provider();
  active = null;
  if (!eth) return false;
  if (eth === wc) {
    try { await wc.disconnect(); return true; } catch { return false; }
  }
  if (!eth.request) return false;
  try {
    await eth.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
    return true;
  } catch {
    return false;
  }
}

// Calls back when the connected account changes or the wallet link is closed. Returns a function that stops listening.
export function watchWallet(onAccounts: (accounts: string[]) => void): () => void {
  const eth = provider();
  if (!eth?.on) return () => {};
  const onClosed = () => onAccounts([]);
  eth.on("accountsChanged", onAccounts);
  if (eth === wc) eth.on("disconnect", onClosed);
  return () => {
    eth.removeListener?.("accountsChanged", onAccounts);
    if (eth === wc) eth.removeListener?.("disconnect", onClosed);
  };
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
