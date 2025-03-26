import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";
import * as A from "fp-ts/lib/Array.js";
import * as R from "fp-ts/lib/Record.js";
import { pipe } from "fp-ts/lib/function.js";

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readJSON(filePath) {
  try {
    const contents = await fs.readFile(filePath, 'utf8');
    try {
      return JSON.parse(contents);
    } catch (e) {
      console.error('\nJSON parsing failed for file:', filePath);
      console.error('File contents:', contents);
      console.error('Parse error:', e.message);
      console.error('Error position in file:', e.position);
      // Print the context around the error
      if (e.position) {
        const start = Math.max(0, e.position - 30);
        const end = Math.min(contents.length, e.position + 30);
        console.error('Context around error:');
        console.error(contents.slice(start, end));
        console.error(' '.repeat(Math.min(30, e.position - start)) + '^');
      }
      throw e;
    }
  } catch (e) {
    if (e instanceof SyntaxError) {
      // We already handled this above
      throw e;
    }
    console.error('\nFailed to read file:', filePath);
    console.error('Error:', e.message);
    throw e;
  }
}

async function getPackages() {
  const rootPackageJson = await readJSON(path.join(projectRoot, "package.json"));
  return rootPackageJson.workspaces;
}

async function getPackageInfo(packageLocation) {
  const packageJson = await readJSON(path.join(projectRoot, packageLocation, "package.json"));

  // Skip CLI packages - they don't need bundling
  if (packageJson.name === "@marlowe.io/cli") {
    return null;
  }

  if (!packageJson.name) {
    throw new Error(`Missing 'name' field in package.json at ${packageLocation}`);
  }
  if (!packageJson.exports) {
    throw new Error(`Missing 'exports' field in package.json at ${packageLocation}`);
  }
  return {
    exports: packageJson.exports,
    name: packageJson.name.replace("@marlowe.io/", ""),
    location: packageLocation,
  };
}

/**
 * This function builds an input object as required by rollup using the package information
 * as provided by getPackageInfo.
 * For each exported module in the package.json we create an entry in the input object.
 */
export function buildRollupInput(packageInfo) {
  return pipe(
    packageInfo.exports,
    R.toArray,
    // [[Glob exports problem]]
    // Here we filter out the glob arrays, we should try to remove them from our exports
    // definitions as they can increase the surface API significantly and complicate the logic
    // behind package-helper and import-map significantly.
    // This means that for the moment a package that is defined through a glob like this is not
    // available in the ESM bundle.
    A.filter(([exportKey, exportMap]) => !exportKey.includes("*")),
    A.map(([exportKey, exportMap]) => {
      const moduleEntryPoint = exportKey === "." ? packageInfo.name : exportKey.replace(/^\.\//, "");
      return [moduleEntryPoint, path.join(packageInfo.location, exportMap.import)];
    }),
    R.fromEntries
  );
}

/**
 * Gets the package information (name, location, exports) for all packages in the SDK.
 */
export async function getAllPackageInfo() {
  const pkgs = await getPackages();
  const packageInfos = await Promise.all(pkgs.map(getPackageInfo));
  // Filter out null entries (CLI packages)
  return packageInfos.filter(info => info !== null);
}
