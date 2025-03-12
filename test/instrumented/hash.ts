import { hash } from "@/main/security/hash";
import fs from "fs-extra";
import assert from "node:assert";
import { iTest } from "~/test/instrumented/tools";

await iTest.run("Hash File", async () => {
    await fs.writeFile("hash-test.txt", "ciallo, world");

    assert(
        await hash.checkFile("hash-test.txt", "sha1", "f7525f9a515602c82385c51b5bb2678d70f111f2"),
        "SHA-1 should match"
    );
    assert(
        await hash.checkFile("hash-test.txt", "sha256", "7ddfd602ea34e005f781b50de561cd0ac7bb6cb22e5be47dd1f9ad01a5bd64a9"),
        "SHA-256 should match"
    );
}, "lite");
