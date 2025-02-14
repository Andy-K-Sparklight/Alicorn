import { conf } from "@/main/conf/conf";
import { expect, test } from "bun:test";
import fs from "fs-extra";
import path from "node:path";

const cfgPath = path.resolve("emulated", "config.v2.json");
process.env.ALICORN_CONFIG_PATH = cfgPath;

test("Config Read & Write", async () => {
    await fs.remove(cfgPath);
    await conf.load();
    expect(conf().dev.devTools, "Should use default config when missing").toBeFalse();

    conf().dev.devTools = true;
    await conf.store();
    await conf.load();
    expect(conf().dev.devTools, "Should keep changes between saves & loads").toBeTrue();

    // Check array values
    conf().runtime.args.vm = ["arg1"];
    await conf.store();
    await conf.load();
    expect(conf().runtime.args.vm.length, "Should save array values").toEqual(1);
});
