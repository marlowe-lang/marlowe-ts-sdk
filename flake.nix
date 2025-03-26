{
  description = "Marlowe ts-sdk";

  inputs = {
    iogx = { url = "github:input-output-hk/iogx"; };
    marlowe-cardano.url =
      "github:input-output-hk/marlowe-cardano?ref=paluh/runtime@v1.0.1";
    marlowe-plutus.url = "github:input-output-hk/marlowe-plutus";
    marlowe-spec.url = "github:marlowe-lang/marlowe";
    cardano-node.url = "github:IntersectMBO/cardano-node/10.2.1";
    nixpkgs.follows = "iogx/nixpkgs";

    # NOTE: Please update the version manually in the ./nix/packages/cardano-address.nix
    cardano-address-bin = {
      url =
        "https://github.com/IntersectMBO/cardano-addresses/releases/download/4.0.0/cardano-address-4.0.0-linux.tar.gz";
      flake = false;
    };
    # NOTE: Please update the version manually in the ./nix/packages/kupo.nix
    kupo-bin = {
      url =
        "https://github.com/CardanoSolutions/kupo/releases/download/v2.10/kupo-v2.10.0-x86_64-linux.zip";
      flake = false;
    };
    # NOTE: Please update the version manually in the ./nix/packages/ogmios.nix
    ogmios-bin = {
      url =
        "https://github.com/CardanoSolutions/ogmios/releases/download/v6.11.2/ogmios-v6.11.2-x86_64-linux.zip";
      flake = false;
    };
  };

  outputs = inputs:
    inputs.iogx.lib.mkFlake {
      inherit inputs;
      repoRoot = ./.;
      outputs = import ./nix/outputs.nix;
      systems =
        [ "x86_64-linux" "x86_64-darwin" "aarch64-linux" "aarch64-darwin" ];
    };

  nixConfig = {
    extra-substituters = [ "https://cache.iog.io" ];
    extra-trusted-public-keys =
      [ "hydra.iohk.io:f/Ea+s+dFdN+3Y/G+FDgSq+a5NEWhJGzdjvKNGv0/EQ=" ];
    allow-import-from-derivation = true;
  };
}
