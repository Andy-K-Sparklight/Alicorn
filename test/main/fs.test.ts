import { expect, test } from "vitest";
import path from "path";
import { paths } from "@/main/fs/paths.ts";

test("Path Resolution", () => {
    paths.setup({
        storeRoot: path.resolve("emulated", "store")
    });

    expect(paths.store.get("foo.so")).toEqual(path.normalize(path.resolve("emulated", "store", "foo.so")));
});