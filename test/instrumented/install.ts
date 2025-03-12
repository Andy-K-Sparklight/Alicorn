import { containers } from "@/main/container/manage";
import { paths } from "@/main/fs/paths";
import { forgeInstaller } from "@/main/install/forge";
import { smelt } from "@/main/install/smelt";
import { vanillaInstaller } from "@/main/install/vanilla";
import type { VersionProfile } from "@/main/profile/version-profile";
import fs from "fs-extra";
import assert from "node:assert";
import path from "node:path";
import { iTest } from "~/test/instrumented/tools";

await iTest.run("Fetch Version Manifest", async () => {
    const m = await vanillaInstaller.getManifest();

    assert(m.versions.length > 0, "Version list should exist");
    assert([m.latest.release, m.latest.snapshot].includes(m.versions[0].id), "Version list should be sorted");
}, "medium");

const c = containers.create({ id: "test", root: paths.game.to("test"), flags: { link: true } });

let pf: VersionProfile;

await iTest.run("Install Version Profile", async () => {
    pf = await vanillaInstaller.installProfile("1.20.4", c);
    assert(pf.id === "1.20.4", "Should install correct profile");
}, "medium");

await iTest.run("Install Libraries", async () => {
    await vanillaInstaller.installLibraries(pf, c, new Set());
    assert(await fs.pathExists(c.client("1.20.4")), "Client file should exist");
}, "full");

await iTest.run("Install Forge", async () => {
    const v = await forgeInstaller.pickLoaderVersion("1.20.4");
    const fp = await forgeInstaller.downloadInstaller(v, "installer");
    const init = await smelt.readInstallProfile(fp);
    await smelt.deployVersionProfile(init, c);
    await smelt.runPostInstall(init, fp, pf, c);
    const versions = await fs.readdir(path.join(c.props.root, "versions"));

    assert(versions.map(v => v.toLowerCase()).some(v => v.includes("forge")), "Should found Forge installation");
}, "full");

await iTest.run("Install Assets", async () => {
    await vanillaInstaller.installAssets(pf, c, "video-only");
    assert(await fs.pathExists(c.assetIndex(pf.assetIndex.id)), "Asset index file should exist");
    const asi = await fs.readJSON(c.assetIndex(pf.assetIndex.id));
    const objs = Object.values(asi.objects).map((o: any) => o.hash);
    const obj = objs[0];
    assert(await fs.pathExists(c.asset(obj)), `Asset file should exist`);
}, "full");
