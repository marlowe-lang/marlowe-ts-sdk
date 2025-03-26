{ repoRoot, inputs, pkgs, lib, system }:
let
  extraPackages = {
    cardano-address = (pkgs.callPackage
      (import ./packages/cardano-address.nix inputs.cardano-address-bin) { });
    kupo = (pkgs.callPackage (import ./packages/kupo.nix inputs.kupo-bin) { });
    ogmios =
      (pkgs.callPackage (import ./packages/ogmios.nix inputs.ogmios-bin) { });
  };
in [{
  devShells.default = import ./shell.nix {
    inherit repoRoot inputs pkgs lib system extraPackages;
  };
}]
