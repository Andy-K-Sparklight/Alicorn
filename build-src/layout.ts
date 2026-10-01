import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const vendor = path.join(root, "vendor");

export const layout = {
    root,
    vendor,

    viziaSource: path.join(vendor, "vizia"),
};
