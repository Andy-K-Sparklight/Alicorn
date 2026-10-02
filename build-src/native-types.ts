import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import { generateTypeDef } from "@napi-rs/cli";
import consola from "consola";
import fs from "fs-extra";
import { layout } from "./layout.ts";
import { logOnFail } from "./util.ts";

export async function generateNativeTypes() {
    const typeDefDir = path.join(layout.root, "target/napi-types");
    const nativeTypesPath = path.join(layout.build, "types/alicorn-r.d.ts");
    await fs.emptyDir(typeDefDir);

    consola.start("Considering types in Rust...");
    const proc = spawn("cargo", ["check", "--package", "alicorn-napi", "--lib"], {
        cwd: layout.root,
        stdio: "inherit",
        env: { ...process.env, NAPI_TYPE_DEF_TMP_FOLDER: typeDefDir },
    });
    const [code, signal] = await once(proc, "exit");
    if (code !== 0) {
        throw "cargo failed with " + (signal ?? code);
    }

    consola.start("Writing types: " + nativeTypesPath);
    const { dts } = await generateTypeDef({ typeDefDir, cwd: layout.root });
    await fs.outputFile(nativeTypesPath, dts);
    consola.success("Types generated.");
}

await logOnFail(generateNativeTypes);
