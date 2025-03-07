export interface MpmManifest {
    contents: MpmEntry[];
    localFiles: MpmLocalFile[];
}

export interface MpmLocalFile {
    path: string;
    sha1: string;
}

export interface MpmEntry {
    id: string;
    vendor: string;
    version?: string;
}
