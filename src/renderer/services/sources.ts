import { useEffect, useState } from "react";
import type { VersionManifest } from "@/main/install/vanilla";

export function useVersionManifest(): VersionManifest | null {
    const [versionManifest, setVersionManifest] = useState<VersionManifest | null>(null);

    useEffect(() => {
        native.sources.getVersionManifest().then(setVersionManifest);
    }, []);

    return versionManifest;
}
