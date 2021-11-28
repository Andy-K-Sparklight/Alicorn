/*
This is the HEAD script for Alicorn.
It has been delegated from webpack and shall do works such as module loading, etc.
*/

console.log("=== ALICORN ===");

window["al_undici"] = require("./undici"); // Binding
