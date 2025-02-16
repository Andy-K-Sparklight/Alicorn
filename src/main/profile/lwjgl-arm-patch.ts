/**
 * Add the missing ARM64 artifacts for LWJGL 3.3.x on GNU/Linux.
 */
import { MavenName } from "@/main/profile/maven-name";
import type { Library, LibraryArtifact } from "@/main/profile/version-profile";
import { unwrapESM } from "@/main/util/module";
import os from "node:os";

async function patchLibraries(libraries: unknown[]) {
    if (os.arch() !== "arm64") return; // Skip patching

    const lwjglArtifacts = await unwrapESM(import("@/refs/lwjgl-artifacts.json")) as Record<string, LibraryArtifact>;
    const availableArtifacts = new Set(Object.keys(lwjglArtifacts));

    const injectLibs = new Set<string>();

    for (const lib of libraries) {
        if (typeof lib === "object" && lib && "name" in lib && typeof lib.name === "string") {
            const m = new MavenName(lib.name);
            const name = [m.group, m.artifact, m.version, "natives-linux-arm64"].join(":");

            if (availableArtifacts.has(name)) {
                injectLibs.add(name);
            }
        }
    }

    const addLibs: Library[] = [...injectLibs.values()].map(libName => {
        console.debug(`Adding LWJGL library: ${libName}`);

        const artifact = lwjglArtifacts[libName];

        return {
            downloads: {
                artifact
            },
            name: libName,
            rules: [
                {
                    action: "allow",
                    os: {
                        name: "linux"
                    }
                }
            ]
        };
    });

    libraries.push(...addLibs);
}

export const lwjglARMPatch = { patchLibraries };
