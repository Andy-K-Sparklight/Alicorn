import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const patches = path.join(root, "patches");
const vendor = path.join(root, "vendor");

/**
 * Absolute repository paths that are independent of the process working directory.
 */
export const layout = {
    root,
    build: path.join(root, "build"),
    dist: path.join(root, "dist"),
    resources: path.join(root, "resources"),
    vendor,
    viziaSource: path.join(vendor, "vizia"),
    viziaPatches: path.join(patches, "vizia"),
    viziaSourceInfo: path.join(patches, "vizia-source.json"),
};
