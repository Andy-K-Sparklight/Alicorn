import type { ContainerSpec } from "@/main/container/spec";
import { paths } from "@/main/fs/paths";
import { reg, registry } from "@/main/registry/registry";
import fs from "fs-extra";
import assert from "node:assert";
import { iTest } from "~/test/instrumented/tools";

/**
 * This test does not run in Bun so it's classified as instrumented tests.
 */
export async function checkRegistries() {
    await iTest.run("Registries Save & Load", async () => {
        const c: ContainerSpec = {
            id: "default",
            root: "fake-root",
            flags: {}
        };

        reg.containers.add(c.id, c);

        assert(reg.containers.get("default") === c, "Should save registry content in memory");

        await registry.close();

        const m = await fs.readJSON(paths.store.to("registries.json"));

        const co = m["containers"]["default"];

        assert(co !== null, "Should save registry content to database");
        assert(co?.root === "fake-root", "Should keep object information");
    });
}
