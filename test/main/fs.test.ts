import { expect, test } from "vitest";
import path from "path";
import { paths } from "@/main/fs/paths";

test("Path Resolution", () => {
    paths.setup({
        storeRoot: path.resolve("emulated", "store")
    });

    expect(paths.store.to("foo.so"), "Should resolve file path correctly")
        .to.equal(path.normalize(path.resolve("emulated", "store", "foo.so")));
});