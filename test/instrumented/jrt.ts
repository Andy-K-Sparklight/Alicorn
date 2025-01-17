import { jrt } from "@/main/jrt/install";
import fs from "fs-extra";
import assert from "node:assert";
import child_process from "node:child_process";
import { iTest } from "~/test/instrumented/tools";

export async function checkInstallJRT() {
    await iTest.run("Install JRT", async () => {
        await jrt.installRuntime("java-runtime-gamma", () => {});
        const bin = jrt.executable("java-runtime-gamma");
        const proc = child_process.spawn(bin, ["-version"], { stdio: "inherit" });

        assert((await fs.stat(bin)).isFile(), "JRT executable file should exist");

        await new Promise<void>((res, rej) => {
            proc.on("error", rej);
            proc.once("exit", (code) => {
                if (code === 0) res();
                else rej(`Unexpected exit code: ${rej}`);
            });
        });
    });
}