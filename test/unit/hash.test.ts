import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { hash } from "@/main/security/hash";

/**
 * File hashing returns SHA-1 and SHA-256 digests for empty and multi-chunk binary files.
 */
test("hash_forFile_output", async t => {
    const dir = await mkdtemp(path.join(tmpdir(), "alicorn-hash-"));
    t.after(() => rm(dir, { recursive: true, force: true }));
    const file = path.join(dir, "data");

    for (const data of [Buffer.alloc(0), Buffer.alloc(1024 * 1024, 0xa5)]) {
        await writeFile(file, data);
        for (const algorithm of ["sha1", "sha-1", "SHA1", "SHA-1", "sha256"]) {
            assert.equal(
                await hash.forFile(file, algorithm),
                createHash(algorithm).update(data).digest("hex"),
            );
        }
    }
});

/**
 * Hash verification accepts matching digests and returns false for a mismatch.
 */
test("hash_checkFile_output", async t => {
    const dir = await mkdtemp(path.join(tmpdir(), "alicorn-hash-"));
    t.after(() => rm(dir, { recursive: true, force: true }));
    const file = path.join(dir, "data");
    await writeFile(file, "abc");

    assert.equal(
        await hash.checkFile(file, "sha1", "a9993e364706816aba3e25717850c26c9cd0d89d"),
        true,
    );
    assert.equal(await hash.checkFile(file, "sha1", "0".repeat(40)), false);
});

/**
 * File hashing rejects unsupported algorithms and file-access failures.
 */
test("hash_forFile_err", async t => {
    const dir = await mkdtemp(path.join(tmpdir(), "alicorn-hash-"));
    t.after(() => rm(dir, { recursive: true, force: true }));
    const file = path.join(dir, "data");
    await writeFile(file, "abc");

    await assert.rejects(hash.forFile(file, "unsupported-algorithm"), Error);
    await assert.rejects(hash.forFile(path.join(dir, "missing"), "sha1"), { code: "ENOENT" });
    await assert.rejects(hash.checkFile(path.join(dir, "missing"), "sha1", ""), { code: "ENOENT" });
});
