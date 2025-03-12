import { paths } from "@/main/fs/paths";
import type { GameProfile } from "@/main/game/spec";
import { reg, registry } from "@/main/registry/registry";
import fs from "fs-extra";
import assert from "node:assert";
import { iTest } from "~/test/instrumented/tools";

/**
 * This test does not run in Bun so it's classified as instrumented tests.
 */
await iTest.run("Registries Save & Load", async () => {
    const g = {
        id: "default",
        name: "fake",
        launchHint: {
            containerId: "" // Required when purging
        }
    } as GameProfile; // We're not building a full copy here

    reg.games.add(g.id, g);

    assert(reg.games.get("default") === g, "Should save registry content in memory");

    await registry.close();

    const m = await fs.readJSON(paths.store.to("registries.json"));

    const co = m["games"]["default"];

    assert(!!co, "Should save registry content");
    assert(co.name === "fake", "Should keep object information");
}, "lite");
