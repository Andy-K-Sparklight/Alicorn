import { exceptions } from "@/main/util/exception";
import fs from "fs-extra";
import path from "node:path";

async function fetchJSON(url: string): Promise<unknown> {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw exceptions.create("network", { url, code: res.status });
    return await res.json();
}

interface VersionManifest {
    versions: { id: string; complianceLevel: number }[];
}

async function createComplianceLevelRef() {
    const versionManifest = await fetchJSON("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json") as VersionManifest;
    const out: Record<string, number> = {};
    for (const { id, complianceLevel } of versionManifest.versions) {
        out[id] = complianceLevel;
    }

    const data = { complianceLevels: out };
    await fs.outputJSON(path.resolve(import.meta.dirname, "../src/refs/compliance-levels.json"), data, { spaces: 4 });
}

async function main() {
    console.log("Creating compliance level table...");
    await createComplianceLevelRef();

    console.log("Compatibility tables generated.");
}

void main();
