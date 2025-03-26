ogmiosBin:
{ lib, stdenv, autoPatchelfHook, zlib, gmp, unzip }:
stdenv.mkDerivation {
  pname = "ogmios";
  version = "6.11.2";

  src = "${ogmiosBin}";

  nativeBuildInputs = [ autoPatchelfHook unzip ];
  buildInputs = [ zlib gmp stdenv.cc.cc.lib ];

  sourceRoot = ".";

  dontUnpack = true;

  installPhase = ''
    cp -R $src $out
  '';

  meta = with lib; {
    description = "Ogmios - A Cardano chain sync solution";
    homepage = "https://github.com/CardanoSolutions/ogmios";
    license = licenses.asl20;
    platforms = platforms.linux;
  };
}
