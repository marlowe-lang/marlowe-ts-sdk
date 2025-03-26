import { execSync } from 'child_process';

export function checkDependencies() {
  try {
    execSync('cardano-cli --version');
    execSync('cardano-address --version');
  } catch (error) {
    console.error(`
Required dependencies are missing. Please ensure you have installed:
- cardano-cli (v10.4.0.0+): https://github.com/IntersectMBO/cardano-cli/releases/tag/cardano-cli-10.4.0.0
- cardano-address (v4.0.0+): https://github.com/IntersectMBO/cardano-addresses/releases/tag/4.0.0

These are also available in the provided nix shell.
`);
    process.exit(1);
  }
}

export function runCommand(command: string): string {
  return execSync(command).toString().trim();
}
