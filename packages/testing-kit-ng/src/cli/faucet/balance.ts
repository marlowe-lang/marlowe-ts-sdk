import { runCommand } from '../utils.js';
import * as fs from 'fs';

export interface BalanceCommandArgs {
  cardanoNodeSocketPath: string;
  cardanoNodeNetworkId: string;
  address?: string;
  walletFile?: string;
}

export async function balanceCommand(args: BalanceCommandArgs) {
  let address = args.address;

  if (args.walletFile) {
    const wallet = JSON.parse(fs.readFileSync(args.walletFile, 'utf-8'));
    address = wallet.address;
  }

  if (!address) {
    throw new Error('Either address or wallet-file must be provided');
  }

  const balance = runCommand(`cardano-cli query utxo \
    --address ${address} \
    --socket-path ${args.cardanoNodeSocketPath} \
    --${args.cardanoNodeNetworkId}`);

  console.log(balance);
}
