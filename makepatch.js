const fs = require("fs-extra");
const { zip } = require("compressing");

(async () => {
  console.log("Making patch file!");
  await fs.ensureDir("./dist/Alicorn/release");
  await fs.ensureDir("./out");
  await fs.copy("./dist/release", "./dist/Alicorn/release/");
  console.log("Compressing!");
  await zip.compressDir("./dist/Alicorn", "./out/patch.zip");
  await fs.remove("./dist/Alicorn");
  console.log("Patch built to output folder.");
})();
