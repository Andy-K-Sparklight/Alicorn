import { cache } from "@/main/cache/cache";
import { hash } from "@/main/security/hash";
import fs from "fs-extra";
import assert from "node:assert";
import { iTest } from "~/test/instrumented/tools";

export async function checkCache() {
    await iTest.run("Reuse Cached File", async () => {
        await fs.writeFile("cache-data.txt", "ciallo, world");
        const sha1 = await hash.forFile("cache-data.txt", "sha1");
        await cache.enroll("cache-data.txt");

        await cache.deploy("reuse-data.txt", sha1, true);
        const dat = await fs.readFile("reuse-data.txt");

        assert(dat.toString() === "ciallo, world", "Reused files should have the same content");

        try {
            await fs.writeFile("reuse-data.txt", "this should not be written");
        } catch {}

        const dat1 = await fs.readFile("reuse-data.txt");
        assert(dat1.toString() === "ciallo, world", "Reused files should be readonly");
    });
}
