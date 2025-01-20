import type { ContainerSpec } from "@/main/container/spec";
import { paths } from "@/main/fs/paths";
import { reg, registry } from "@/main/registry/registry";
import { Database } from "node-sqlite3-wasm";
import assert from "node:assert";
import { Serializer } from "superserial";
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

        registry.close();

        const db = new Database(paths.store.to("registries.arc"));
        const { content } = db.get(`
            SELECT content
            FROM registries
            WHERE id = 'containers';
        `) as { content: string };

        const m = new Serializer({ classes: {} }).deserialize<Map<string, ContainerSpec>>(content);

        const co = m.get("default");

        assert(co !== null, "Should save registry content to database");
        assert(co?.root === "fake-root", "Should keep object information");
    });
}
