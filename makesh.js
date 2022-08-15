// Inject alicorn.sh for GNU/Linux
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs");
fs.copyFile(
  "./resources/build/install.sh",
  "./out/Alicorn-linux-x64/install.sh",
  () => {
    fs.chmod("./out/Alicorn-linux-x64/install.sh", 0o755, () => {
      console.log("Shell installer emitted.");
    });
  }
);
fs.copyFile(
  "./resources/build/icon.png",
  "./out/Alicorn-linux-x64/Alicorn.png",
  () => {
    console.log("Icon emitted.");
  }
);
