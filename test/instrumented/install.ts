import { vanillaInstaller } from "@/main/install/vanilla";
import assert from "node:assert";
import { iTest } from "~/test/instrumented/tools";

export async function checkInstaller() {
    await iTest.run("Fetch Version Manifest", async () => {
        const m = await vanillaInstaller.getManifest();

        assert(m.versions.length > 0, "Version list should exist");
        assert([m.latest.release, m.latest.snapshot].includes(m.versions[0].id), "Version list should be sorted");
    });
}