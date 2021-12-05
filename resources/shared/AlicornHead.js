/*
This is the HEAD script for Alicorn.
It has been delegated from webpack and shall do works such as module loading, etc.
*/
(() => {
  console.log("=== ALICORN ===");
  let undici = null;
  Object.defineProperty(window, "al_undici", {
    get: () => {
      if (undici) {
        return undici;
      }
      return (undici = require("./undici"));
    },
  });
})();
