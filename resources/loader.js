import { createRequire } from "node:module";

global.require = createRequire(import.meta.url);
void import("./main.js");