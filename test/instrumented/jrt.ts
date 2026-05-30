import os from "node:os";
import { jrt } from "@/main/jrt/install";
import { iTest } from "~/test/instrumented/tools";

await iTest.run(
    "Install JRT",
    async () => {
        await jrt.installRuntime("java-runtime-gamma");
    },
    "full",
);

if (os.platform() === "darwin") {
    await iTest.run(
        "Install Legacy JRT on macOS",
        async () => {
            await jrt.installRuntime("jre-legacy");
        },
        "full",
    );
}
