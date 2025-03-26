import { runCommand } from '../utils.js';
import * as fs from 'fs';

export interface CreateCommandArgs {
  cardanoNodeSocketPath: string;
  cardanoNodeNetworkId: string;
}

export async function createCommand(args: CreateCommandArgs) {
  // Generate mnemonic using cardano-address
  const mnemonic = runCommand('cardano-address recovery-phrase generate --size 24');

  // Generate address (adapting from generate-claims.ts)
  fs.writeFileSync('temp_mnemonic', mnemonic);
  runCommand('cat temp_mnemonic | cardano-address key from-recovery-phrase Shelley > root.prv');
  runCommand('cat root.prv | cardano-address key child 1852H/1815H/0H/0/0 > payment.prv');
  runCommand('cat payment.prv | cardano-address key public --without-chain-code > payment.pub');
  runCommand('cat payment.pub | cardano-address address payment --network-tag 0 > address');

  const address = fs.readFileSync('address', 'utf-8').trim();

  // Clean up temporary files
  ['temp_mnemonic', 'root.prv', 'payment.prv', 'payment.pub', 'address'].forEach((file) => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });

  const wallet = {
    address,
    mnemonic,
  };

  // Output JSON to stdout
  console.log(JSON.stringify(wallet, null, 2));

  // Output provisioning message to stderr
  console.error(`
Note: The new testing-faucet address ${address} needs to be manually provisioned on the network ${args.cardanoNodeNetworkId}.
`);
}
