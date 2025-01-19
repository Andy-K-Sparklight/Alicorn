import { paths } from "@/main/fs/paths";
import { expect, test } from "bun:test";
import path from "path";

test("Path Resolution", () => {
    paths.setup({
        storeRoot: path.resolve("emulated", "store")
    });

    expect(paths.store.to("foo.so"), "Should resolve file path correctly")
        .toEqual(path.normalize(path.resolve("emulated", "store", "foo.so")));
});
