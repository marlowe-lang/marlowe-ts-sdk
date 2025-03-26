kupoBin:
{ lib, stdenv, autoPatchelfHook, zlib, gmp }:
stdenv.mkDerivation {
  pname = "kupo";
  version = "2.10.0";

  src = "${kupoBin}";

  nativeBuildInputs = [ autoPatchelfHook ];
  buildInputs = [ zlib gmp stdenv.cc.cc.lib ];

  sourceRoot = ".";

  installPhase = ''
    cp -R $src $out
    chmod +x $out/bin/kupo
  '';

  meta = with lib; {
    description = "Kupo - A Cardano chain index service";
    homepage = "https://github.com/CardanoSolutions/kupo";
    license = licenses.asl20;
    platforms = platforms.linux;
  };
}

