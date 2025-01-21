import { containers } from "@/main/container/manage";
import { paths } from "@/main/fs/paths";
import { vanillaInstaller } from "@/main/install/vanilla";
import type { VersionProfile } from "@/main/profile/version-profile";
import fs from "fs-extra";
import assert from "node:assert";
import { iTest } from "~/test/instrumented/tools";

export async function checkInstaller() {
    await iTest.run("Fetch Version Manifest", async () => {
        const m = await vanillaInstaller.getManifest();

        assert(m.versions.length > 0, "Version list should exist");
        assert([m.latest.release, m.latest.snapshot].includes(m.versions[0].id), "Version list should be sorted");
    });

    const c = containers.create({ id: "test", root: paths.game.to("test"), flags: { link: true } });

    let pf: VersionProfile;

    await iTest.run("Install Version Profile", async () => {
        pf = await vanillaInstaller.installProfile("1.20.4", c);
        assert(pf.id === "1.20.4", "Should install correct profile");
    });

    await iTest.run("Install Libraries", async () => {
        await vanillaInstaller.installLibraries(pf, c, new Set());
        await fs.access(c.client(pf.id));
    });
}
