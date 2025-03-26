import type { Argv } from 'yargs';
import { registerTestingCommands } from '@marlowe.io/testing-kit-ng';

export function registerCommands(yargs: Argv) {
  return yargs
    .command('testing', 'Testing related commands', registerTestingCommands)
    .demandCommand(1, 'You need to specify a command')
    .help();
}
