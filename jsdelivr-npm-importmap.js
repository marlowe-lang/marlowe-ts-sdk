const importMap = {
  imports: {
    "@marlowe.io/testing-kit-ng":
      "https://cdn.jsdelivr.net/npm/@marlowe.io/testing-kit-ng@0.4.0-beta/dist/bundled/esm/testing-kit-ng.js",
    "lucid-cardano": "https://unpkg.com/lucid-cardano@0.10.7/web/mod.js",
  },
};
const im = document.createElement("script");
im.type = "importmap";
im.textContent = JSON.stringify(importMap);
document.currentScript.after(im);
