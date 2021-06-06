// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require("fs-extra");
(async () => {
  try {
    const f1 = "./dist/StarlightBuild.json";
    const f2 = "./dist/RendererBuild.json";
    const j1 = await fs.readJSON(f1);
    const j2 = await fs.readJSON(f2);
    j2["files"] = j2["files"].concat(j1["files"]);
    await fs.writeJSON(f2, j2);
  } catch {}
})();
(async () => {
  try {
    const f1 = "./dist/release/StarlightBuild.json";
    const f2 = "./dist/release/RendererBuild.json";
    const j1 = await fs.readJSON(f1);
    const j2 = await fs.readJSON(f2);
    j2["files"] = j2["files"].concat(j1["files"]);
    await fs.writeJSON(f2, j2);
  } catch {}
})();
