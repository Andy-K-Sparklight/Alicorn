import { getOSName } from "@/main/sys/os";
import os from "node:os";
import { mget } from "@/main/net/fetch";
import { is } from "typia";

const JRT_MANIFEST = "https://piston-meta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json";

interface JavaRuntimeProfile {
    manifest: {
        sha1: string;
        size: number;
        url: string;
    };

    version?: {
        released?: string;
    };
}

function osPair(): string {
    const arch = os.arch();
    switch (getOSName()) {
        case "windows":
            if (arch.includes("arm")) return "windows-arm64";
            if (arch === "ia32") return "windows-x86";
            if (arch === "x64") return "windows-x64";
            break;
        case "osx":
            if (arch.includes("arm")) return "mac-os-arm64";
            if (arch === "x64") return "mac-os";
            break;
        case "linux":
            if (arch === "ia32") return "linux-i386";
            if (arch === "x64") return "linux";
            break;
    }

    return "unknown";
}

async function getProfile(componentName: string): Promise<JavaRuntimeProfile> {
    const d = await (await mget(JRT_MANIFEST)).json();
    const availableProfiles = d[osPair()][componentName];

    if (!is<JavaRuntimeProfile[]>(availableProfiles) || availableProfiles.length < 1) {
        throw `Could not find available JRT profiles for ${componentName}`;
    }

    // Gets the latest release
    return availableProfiles.reduce((prev, it) => {
        if (prev.version?.released && it.version?.released) {
            const d1 = new Date(prev.version.released);
            const d2 = new Date(it.version.released);

            return d2.getTime() > d1.getTime() ? it : prev;
        } else {
            if (it.version?.released) return it;
            return prev;
        }
    });
}