import type { VersionManifest } from "@/main/install/vanilla";
import { useEffect, useState } from "react";

export function useVersionManifest(): VersionManifest | null {
    const [versionManifest, setVersionManifest] = useState<VersionManifest | null>(null);

    useEffect(() => {
        native.sources.getVersionManifest().then(setVersionManifest);
    }, []);

    return versionManifest;
}
