import { containers } from "@/main/container/manage";
import { paths } from "@/main/fs/paths";
import { vanillaInstaller } from "@/main/install/vanilla";
import assert from "node:assert";
import { iTest } from "~/test/instrumented/tools";

export async function checkInstaller() {
    await iTest.run("Fetch Version Manifest", async () => {
        const m = await vanillaInstaller.getManifest();

        assert(m.versions.length > 0, "Version list should exist");
        assert([m.latest.release, m.latest.snapshot].includes(m.versions[0].id), "Version list should be sorted");
    });

    const c = containers.create({ id: "test", root: paths.game.to("test"), flags: {} });

    await iTest.run("Install Version Profile", async () => {
        const pf = await vanillaInstaller.installProfile("1.20.4", c);
        assert(pf.id === "1.20.4", "Should install correct profile");
    });
}
