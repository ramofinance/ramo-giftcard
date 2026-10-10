import { ethers } from "ethers";
const BSC_RPC = "https://bsc-dataseed1.binance.org";
const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";
export async function generateWallet() {
  const wallet = ethers.Wallet.createRandom();
  return { address: wallet.address, mnemonic: wallet.mnemonic!.phrase };
}
export async function transferUSDT(treasuryKey: string, toAddress: string, amountUSDT: string) {
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const treasury = new ethers.Wallet(treasuryKey, provider);
  const usdt = new ethers.Contract(USDT_CONTRACT, ["function transfer(address to, uint256 amount) returns (bool)", "function balanceOf(address) view returns (uint256)"], treasury);
  const amountWei = ethers.parseUnits(amountUSDT, 18);
  const tx = await usdt.transfer(toAddress, amountWei);
  await tx.wait();
  return tx.hash;
}
export async function checkPayment(treasuryAddress: string, senderAddress: string, expectedAmount: string) {
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const usdt = new ethers.Contract(USDT_CONTRACT, ["event Transfer(address indexed from, address indexed to, uint256 value)"], provider);
  const filter = usdt.filters.Transfer(senderAddress, treasuryAddress);
  const logs = await provider.getLogs({ ...filter, fromBlock: -30, toBlock: "latest" });
  if (logs.length === 0) return null;
  const parsed = usdt.interface.parseLog(logs[logs.length - 1]);
  if (!parsed) return null;
  const received = ethers.formatUnits(parsed.args.value, 18);
  if (parseFloat(received) >= parseFloat(expectedAmount)) return logs[logs.length - 1].transactionHash;
  return null;
}
