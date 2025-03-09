import pkg from "./package.json" with { type: "json" };

export default {
    codename: pkg.codename,
    version: pkg.version
};
