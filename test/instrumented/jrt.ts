import { jrt } from "@/main/jrt/install";
import { iTest } from "~/test/instrumented/tools";

export async function checkInstallJRT() {
    await iTest.run("Install JRT", async () => {
        await jrt.installRuntime("java-runtime-gamma");
    });
}
