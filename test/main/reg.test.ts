import { expect, test } from "vitest";
import path from "path";
import { paths } from "@/main/fs/paths";
import { reg, registry } from "@/main/registry/registry";
import { StaticContainer } from "@/main/container/static";
import { Database } from "node-sqlite3-wasm";
import { Serializer } from "superserial";

test("Registry Load & Save", async () => {
    paths.setup({
        storeRoot: path.resolve("emulated")
    });

    await registry.init();

    const c = new StaticContainer("default", ".");

    reg.containers.add(c.id, c);

    expect(reg.containers.get("default"), "Should save registry content in memory").to.equal(c);

    registry.close();

    const db = new Database(path.resolve("emulated", "registries.arc"));
    const { content } = db.get(`
        SELECT content
        FROM registries
        WHERE id = 'containers';
    `) as { content: string };

    const m = new Serializer({ classes: { StaticContainer } }).deserialize<Map<string, StaticContainer>>(content);

    expect(m.get("default"), "Should save registry content to database").to.be.not.null;
    expect(m.get("default"), "Should keep class information").to.be.instanceof(StaticContainer);
});