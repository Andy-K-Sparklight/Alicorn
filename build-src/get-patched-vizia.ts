import { glob } from "node:fs/promises";
import path from "node:path";
import consola from "consola";
import { execa } from "execa";
import fs from "fs-extra";
import { layout } from "~/build-src/layout.ts";
import { logOnFail } from "~/build-src/util.ts";

/**
 * Fetches or updates Vizia sources, and apply contained patches on the specified commit.
 *
 * Any local changes within the source directory will be lost (including untracked items).
 */
async function prepare() {
    const source = await fs.readJson(path.join(layout.root, "patches/vizia-source.json"));
    const patches = (
        await Array.fromAsync(glob("**/*.patch", { cwd: path.join(layout.root, "patches/vizia") }))
    )
        .sort()
        .map(name => path.join(layout.root, "patches/vizia", name));
    for (const patch of patches) await fs.access(patch);

    await fs.ensureDir(layout.vendor);
    const run = execa({ cwd: layout.vendor, stdin: "ignore", stderr: "inherit" });
    if (!(await fs.pathExists(layout.viziaSource))) {
        consola.start("Cloning Vizia...");
        await run`git clone --filter=blob:none --no-checkout ${source.repository} ${layout.viziaSource}`;
    }

    const ex = run({ cwd: layout.viziaSource });
    if (
        !(await fs.stat(path.join(layout.viziaSource, ".git"))).isDirectory() ||
        (await fs.realpath((await ex`git rev-parse --show-toplevel`).stdout)) !==
            (await fs.realpath(layout.viziaSource))
    ) {
        throw new Error(`Expected a standalone Git checkout: ${layout.viziaSource}`);
    }
    const { stdout: origin } = await ex`git remote get-url --all origin`;
    if (origin !== source.repository && origin !== `${source.repository}.git`) {
        throw new Error(`Unexpected Vizia origin: ${origin}`);
    }

    consola.start(`Preparing Vizia at ${source.revision}; discarding checkout-local changes...`);
    await ex`git fetch --depth=1 origin ${source.revision}`;
    await ex`git reset --hard`;
    await ex`git clean -ffdx`;
    await ex`git checkout --detach --force ${source.revision}`;
    await ex`git clean -ffdx`;
    if (
        (await ex`git rev-parse HEAD`).stdout !== source.revision ||
        (await ex`git status --porcelain --untracked-files=all`).stdout !== ""
    ) {
        throw new Error("Vizia should be clean at the pinned revision before applying patches");
    }

    if (patches.length > 0) {
        await ex`git apply --check ${patches}`;
        await ex`git apply ${patches}`;
    }
    consola.success(`Patched Vizia is ready at ${layout.viziaSource}`);
}

await logOnFail(prepare);
