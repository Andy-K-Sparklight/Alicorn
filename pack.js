// eslint-disable-next-line @typescript-eslint/no-var-requires
const compressing = require("compressing");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs-extra");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
const tDir = "./out/";

const all = fs.readdirSync(tDir);
try {
  fs.mkdirSync(path.join(tDir, "compressed"));
} catch {}
Promise.allSettled(
  all.map((e) => {
    const c = path.join(tDir, e);
    const s = fs.statSync(c);
    if (s.isDirectory()) {
      if (e.startsWith("Alicorn-win32")) {
        return compressing.zip.compressDir(
          c,
          path.join(tDir, "compressed", e + ".zip"),
          {}
        );
      }
      if (e.startsWith("Alicorn-linux")) {
        return compressing.tgz.compressDir(
          c,
          path.join(tDir, "compressed", e + ".tar.gz")
        );
      }
    }
    return Promise.resolve();
  })
)
  .then(() => {
    console.log("Compressed output.");
  })
  .catch((e) => {
    console.log("Could not compress output. Caused by: " + e);
  });
