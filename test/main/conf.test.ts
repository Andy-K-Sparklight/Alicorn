import { conf } from "@/main/conf/conf";
import fs from "fs-extra";
import path from "path";
import { expect, test } from "vitest";

const cfgPath = path.resolve("emulated", "config.v2.json");
process.env.ALICORN_CONFIG_PATH = cfgPath;

test("Config Read & Write", async () => {
    await fs.remove(cfgPath);
    await conf.load();
    expect(conf().inspect, "Should use default config when missing").to.be.false;

    conf().inspect = true;
    await conf.store();
    await conf.load();
    expect(conf().inspect, "Should keep changes between saves & loads").to.be.true;

    // Ensure that unmodified keys are excluded
    conf().inspect = false;
    await conf.store();
    expect(fs.existsSync(cfgPath), "Should empty file when no changes are made").to.be.false;
});