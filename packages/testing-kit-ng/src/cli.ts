import type { Argv, ArgumentsCamelCase, Options, MiddlewareFunction } from 'yargs';
import { checkDependencies } from './cli/utils.js';
import { createCommand, CreateCommandArgs } from './cli/faucet/create.js';
import { balanceCommand, BalanceCommandArgs } from './cli/faucet/balance.js';

const commonOptions = {
  s: {
    alias: 'cardano-node-socket-path',
    type: 'string' as const,
    description: 'Path to cardano node socket',
    default: process.env.CARDANO_NODE_SOCKET_PATH,
    demandOption: true,
    requiresArg: true,
  } satisfies Options,
  n: {
    alias: 'cardano-node-network-id',
    type: 'string' as const,
    description: 'Cardano network ID',
    default: process.env.CARDANO_NODE_NETWORK_ID,
    demandOption: true,
    requiresArg: true,
  } satisfies Options,
} as const;

// Middleware to validate required environment variables if CLI args not provided
const validateEnvVars: MiddlewareFunction = (argv: ArgumentsCamelCase): void => {
  if (!argv.cardanoNodeSocketPath && !process.env.CARDANO_NODE_SOCKET_PATH) {
    throw new Error(
      'Cardano node socket path must be provided via --cardano-node-socket-path or CARDANO_NODE_SOCKET_PATH environment variable'
    );
  }
  if (!argv.cardanoNodeNetworkId && !process.env.CARDANO_NODE_NETWORK_ID) {
    throw new Error(
      'Cardano network ID must be provided via --cardano-node-network-id or CARDANO_NODE_NETWORK_ID environment variable'
    );
  }
};

export function registerTestingCommands(yargs: Argv) {
  return yargs
    .middleware([checkDependencies, validateEnvVars])
    .command(
      'faucet create',
      'Create new testing faucet wallet',
      (yargs) => {
        return yargs.options(commonOptions);
      },
      async (argv: ArgumentsCamelCase<CreateCommandArgs>) => {
        return createCommand(argv);
      }
    )
    .command(
      'faucet check-balance',
      'Check balance of testing faucet wallet',
      (yargs) => {
        return yargs
          .options(commonOptions)
          .option('address', {
            type: 'string',
            description: 'Wallet address',
          })
          .option('wallet-file', {
            type: 'string',
            description: 'Wallet JSON file',
          })
          .conflicts('address', 'wallet-file')
          .check((argv) => {
            if (!argv.address && !argv.walletFile) {
              throw new Error('Either --address or --wallet-file must be provided');
            }
            return true;
          });
      },
      async (argv: ArgumentsCamelCase<BalanceCommandArgs>) => {
        return balanceCommand(argv);
      }
    );
}
