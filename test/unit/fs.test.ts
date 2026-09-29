import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { mockElectron } from "~/test/electron-mock";

test("Path Resolution", async t => {
    mockElectron(t);
    const { paths } = await import("@/main/fs/paths");
    paths.setup({
        storeRoot: path.resolve("emulated", "store"),
    });

    assert.equal(
        paths.store.to("foo.so"),
        path.normalize(path.resolve("emulated", "store", "foo.so")),
        "Should resolve file path correctly",
    );
});
