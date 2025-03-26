{ lib, stdenv, autoPatchelfHook, zlib, gmp }:
{ pname, version, bin, binName ? pname, meta }:

stdenv.mkDerivation {
  inherit pname version;

  src = "${bin}/${binName}";

  nativeBuildInputs = [ autoPatchelfHook ];
  buildInputs = [ zlib gmp stdenv.cc.cc.lib ];

  sourceRoot = ".";

  dontUnpack = true;

  installPhase = ''
    mkdir -p $out/bin
    cp $src $out/bin/${binName}
  '';

  inherit meta;
}
