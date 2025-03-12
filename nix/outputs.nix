{ repoRoot, inputs, pkgs, lib, system }:
[
  {
    devShells.default = repoRoot.nix.shell;
    packages.process-compose-config = import ./process-compose-yaml.nix {
      inherit repoRoot inputs pkgs lib system;
    };
  }
]
