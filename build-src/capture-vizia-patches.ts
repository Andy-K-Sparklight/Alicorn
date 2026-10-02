import path from "node:path";
import consola from "consola";
import { execa } from "execa";
import fs from "fs-extra";
import { layout } from "~/build-src/layout.ts";

/**
 * Collects the changes in Vizia sources as patches, placing them under `patches/vizia` with
 * pathname as the prefix.
 */
async function capture() {
    const source = await fs.readJson(layout.viziaSourceInfo);
    const ex = execa({
        cwd: layout.viziaSource,
        stdin: "ignore",
        stderr: "inherit",
        stripFinalNewline: false,
    });
    const { stdout: top } = await ex`git rev-parse --show-toplevel`;
    if ((await fs.realpath(top.trimEnd())) !== (await fs.realpath(layout.viziaSource))) {
        throw new Error(`Expected a Git checkout at ${layout.viziaSource}`);
    }
    const { stdout: origin } = await ex`git remote get-url --all origin`;
    if (origin.trimEnd() !== source.repository && origin.trimEnd() !== `${source.repository}.git`) {
        throw new Error(`Unexpected Vizia origin: ${origin.trimEnd()}`);
    }

    consola.start("Capturing tracked Vizia changes...");
    const { stdout: names } =
        await ex`git diff --no-ext-diff --no-renames --name-only -z ${source.revision} --`;
    const patches = [];
    for (const file of names.split("\0").filter(Boolean).sort()) {
        const { stdout: diff } =
            await ex`git --literal-pathspecs diff --no-ext-diff --no-textconv --no-renames --binary --full-index --src-prefix=a/ --dst-prefix=b/ ${source.revision} -- ${file}`;
        patches.push({ file, diff });
    }

    await fs.emptyDir(layout.viziaPatches);
    for (const { file, diff } of patches) {
        await fs.outputFile(path.join(layout.viziaPatches, `${file}.patch`), diff);
    }
    consola.success(`Saved ${patches.length} Vizia patches to ${layout.viziaPatches}`);
}

try {
    await capture();
} catch (error) {
    consola.error(error);
    process.exitCode = 1;
}
