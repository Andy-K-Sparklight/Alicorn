import { cacheStore } from "@/main/cache/store";
import { hash } from "@/main/security/hash";
import fs from "fs-extra";
import assert from "node:assert";
import { iTest } from "~/test/instrumented/tools";

export async function checkCache() {
    await iTest.run("Reuse Cached File", async () => {
        await fs.writeFile("cache-data.txt", "ciallo, world");
        const sha1 = await hash.forFile("cache-data.txt", "sha1");
        await cacheStore.enroll("cache-data.txt");

        await cacheStore.deploy(sha1, "reuse-data.txt", "copy");
        const dat = await fs.readFile("reuse-data.txt");

        assert(dat.toString() === "ciallo, world", "Reused file should have the same content");
    });
}
