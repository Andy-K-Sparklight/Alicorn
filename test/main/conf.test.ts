import { expect, test } from "vitest";
import path from "path";
import { conf } from "@/main/conf/conf.ts";
import fs from "fs-extra";

const cfgPath = path.resolve("emulated", "config.v2.json");
process.env.ALICORN_CONFIG_PATH = cfgPath;

test("Config Read & Write", async () => {
    await fs.remove(cfgPath);
    await conf.load();
    expect(conf().inspect, "Default config is used").toBe(false);

    conf().inspect = true;
    await conf.store();
    await conf.load();
    expect(conf().inspect, "Changes are kept").toBe(true);

    // Ensure that unmodified keys are excluded
    conf().inspect = false;
    await conf.store();
    expect(fs.existsSync(cfgPath), "File emptied when no changes").toBe(false);
});