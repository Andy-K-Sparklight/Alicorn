// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs-extra");

// Currently we no longer use dll plugin
// While old Alicorns still fetch this file...
const DLL_PLACE_HOLDER = {
  date: "Thu, 01 Jan 1970 08:00:00 GMT",
  files: [],
  version: "Invalid",
};

(async () => {
  // Starlight
  try {
    const f1 = "./dist/StarlightBuild.json";
    const f2 = "./dist/RendererBuild.json";
    const j1 = await fs.readJSON(f1);
    const j2 = await fs.readJSON(f2);
    j2["files"] = noDuplicateConcat(j2["files"], j1["files"]);
    await fs.writeJSON(f2, j2);
  } catch {}
  try {
    const f1 = "./dist/release/StarlightBuild.json";
    const f2 = "./dist/release/RendererBuild.json";
    const j1 = await fs.readJSON(f1);
    const j2 = await fs.readJSON(f2);
    j2["files"] = noDuplicateConcat(j2["files"], j1["files"]);
    await fs.writeJSON(f2, j2);
  } catch {}
  try {
    const f1 = "./dist/WorkerBuild.json";
    const f2 = "./dist/RendererBuild.json";
    const j1 = await fs.readJSON(f1);
    const j2 = await fs.readJSON(f2);
    j2["files"] = noDuplicateConcat(j2["files"], j1["files"]);
    await fs.writeJSON(f2, j2);
  } catch {}
  try {
    const f1 = "./dist/release/WorkerBuild.json";
    const f2 = "./dist/release/RendererBuild.json";
    const j1 = await fs.readJSON(f1);
    const j2 = await fs.readJSON(f2);
    j2["files"] = noDuplicateConcat(j2["files"], j1["files"]);
    await fs.writeJSON(f2, j2);
  } catch {}
  try {
    await fs.writeJSON("./dist/release/DllBuild.json", DLL_PLACE_HOLDER);
  } catch {}
  try {
    await fs.writeJSON("./dist/DllBuild.json", DLL_PLACE_HOLDER);
  } catch {}
})();

function noDuplicateConcat(a1, a2) {
  const s = new Set();
  a1.forEach((e) => {
    s.add(e);
  });
  a2.forEach((e) => {
    s.add(e);
  });
  return Array.from(s);
}
