export interface MpmManifest {
    userPrompt: MpmUserPrompt[];
    resolved: MpmResolvedEntry[];

    /**
     * Maps project ID to version ID, or version ID to version ID.
     */
    dependencies: Record<string, string[]>;
}

export interface MpmUserPrompt {
    id: string;
    vendor: string;
    version?: string;
}

export interface MpmResolvedEntry {
    version: string;
    vendor: string;
    files: MpmLocalFile[];
}

export interface MpmLocalFile {
    path: string;
    sha1: string;
}
