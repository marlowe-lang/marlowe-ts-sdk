cardanoAddressBin:
{ lib, stdenv, autoPatchelfHook, zlib, gmp }:
stdenv.mkDerivation {
  pname = "cardano-address";
  version = "4.0.0";

  src = "${cardanoAddressBin}";

  nativeBuildInputs = [ autoPatchelfHook ];
  buildInputs = [ zlib gmp stdenv.cc.cc.lib ];

  sourceRoot = ".";

  dontUnpack = true;

  installPhase = ''
    mkdir -p $out/bin
    cp $src/cardano-address $out/bin/cardano-address
  '';

  meta = with lib; {
    description = "Cardano Address CLI tool";
    homepage = "https://github.com/IntersectMBO/cardano-addresses";
    license = licenses.asl20;
    platforms = platforms.linux;
  };
}
