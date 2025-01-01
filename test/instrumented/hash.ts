import { iTest } from "~/test/instrumented/tools";
import fs from "fs-extra";
import { hash } from "@/main/security/hash";
import assert from "node:assert";

export async function checkHash() {
    await iTest.run("Hash File", async () => {
        await fs.writeFile("hash-test.txt", "ciallo, world");

        const sha1 = await hash.forFile("hash-test.txt", "sha1");
        const sha256 = await hash.forFile("hash-test.txt", "sha256");

        assert(sha1 === "f7525f9a515602c82385c51b5bb2678d70f111f2", "SHA-1 should match");
        assert(sha256 === "7ddfd602ea34e005f781b50de561cd0ac7bb6cb22e5be47dd1f9ad01a5bd64a9", "SHA-256 should match");
    });
}