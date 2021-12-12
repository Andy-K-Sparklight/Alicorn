const fs = require("fs-extra");
let OUTPUT_DIRS = [
  "out/Alicorn-linux-x64",
  "out/Alicorn-win32-ia32",
  "out/Alicorn-win32-x64",
];
const path = require("path");
async function eliminateExtraFiles() {
  try {
    await Promise.allSettled(
      OUTPUT_DIRS.map(async (d) => {
        let tLocales = path.join(d, "locales");
        let a = await fs.readdir(tLocales);
        await Promise.allSettled(
          a.map(async (f) => {
            if (f !== "en-US.pak") {
              await fs.remove(path.join(tLocales, f));
            }
          })
        );
        await fs.remove(path.join(d, "chrome_crashpad_handler"));
        await fs.remove(path.join(d, "chrome_100_percent.pak"));
        await fs.remove(path.join(d, "chrome_200_percent.pak"));
        await fs.remove(path.join(d, "LICENSES.chromium.html"));
        await fs.remove(path.join(d, "LICENSE"));
      })
    );
  } catch {}
}

eliminateExtraFiles()
  .then(() => {
    console.log("Eliminated extra files!");
  })
  .catch(() => {});
