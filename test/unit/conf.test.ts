import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";

import fs from "fs-extra";
import { conf } from "@/main/conf/conf";
import { mockElectron } from "~/test/electron-mock";

const cfgPath = path.resolve("emulated", "config.v2.json");
process.env.ALICORN_CONFIG_PATH = cfgPath;

test("Config Read & Write", async t => {
    mockElectron(t);

    await fs.remove(cfgPath);
    conf.load();
    assert.ok(!conf().dev.devTools, "Should use default config when missing");

    conf.alter(c => (c.dev.devTools = true));
    await conf.store();
    conf.load();
    assert.ok(conf().dev.devTools, "Should keep changes between saves & loads");

    // Check array values
    conf.alter(c => (c.runtime.args.vm = ["arg1"]));
    await conf.store();
    conf.load();
    assert.equal(conf().runtime.args.vm.length, 1, "Should save array values");
});
