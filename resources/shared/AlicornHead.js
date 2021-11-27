/*
This is the HEAD script for Alicorn.
It has been delegated from webpack and shall do works such as module loading, etc.
*/

console.log("=== ALICORN ===");
try {
  require("./v8-compile-cache");
  console.log("V8 Compile Cache Enabled.");
} catch {
  console.log("V8 Compile Cache Disabled.");
}

window["al_undici"] = require("./undici"); // Binding
