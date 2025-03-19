import type { Container } from "@/main/container/spec";
import fs from "fs-extra";

/**
 * Creates game content directory of the given scope.
 */
async function createContentDir(c: Container, scope: string): Promise<void> {
    const d = c.content(scope);
    if (await fs.pathExists(d)) return;

    await fs.ensureDir(d);
}


export const containerInspector = {
    createContentDir
};
