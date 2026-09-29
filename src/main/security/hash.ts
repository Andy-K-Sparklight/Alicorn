import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { pipeline } from "node:stream/promises";

/**
 * Checks whether the content of a file at `pt` hashes to the same value as `expectHash`, using an
 * `algorithm` supported by {@link createHash}.
 *
 * The supplied `expectHash` must be lowercase.
 */
async function checkFile(pt: string, algorithm: string, expectHash: string): Promise<boolean> {
    return (await forFile(pt, algorithm)) === expectHash;
}

/**
 * Calculates the hash of a file at `pt` using an `algorithm` supported by {@link createHash}.
 * Returns the lowercase hexadecimal representation.
 */
async function forFile(pt: string, algorithm: string): Promise<string> {
    const digest = createHash(algorithm);
    await pipeline(createReadStream(pt), digest);
    return digest.digest("hex");
}

export const hash = {
    forFile,
    checkFile,
};
