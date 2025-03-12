{
  description = "Marlowe ts-sdk";

  inputs = {
    iogx = {
      url = "github:input-output-hk/iogx";
    };
    marlowe-cardano.url = "github:input-output-hk/marlowe-cardano?ref=paluh/runtime@v1.0.1";
    marlowe-plutus.url = "github:input-output-hk/marlowe-plutus";
    marlowe-spec.url = "github:marlowe-lang/marlowe";
    cardano-node.url = "github:IntersectMBO/cardano-node/9.1.0";
    nixpkgs.follows = "iogx/nixpkgs";
  };

  outputs = inputs: inputs.iogx.lib.mkFlake {
    inherit inputs;
    repoRoot = ./.;
    outputs = import ./nix/outputs.nix;
    systems = [ "x86_64-linux" "x86_64-darwin" "aarch64-linux" "aarch64-darwin" ];
  };

  nixConfig = {
    extra-substituters = [
      "https://cache.iog.io"
    ];
    extra-trusted-public-keys = [
      "hydra.iohk.io:f/Ea+s+dFdN+3Y/G+FDgSq+a5NEWhJGzdjvKNGv0/EQ="
    ];
    allow-import-from-derivation = true;
  };
}
