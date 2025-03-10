export interface MpmAddonMeta {
    id: string;
    vendor: string;
    title: string;
    author: string;
    description: string;
    icon: string;
    type: MpmAddonType;
}

export type MpmAddonType = "mods" | "resourcepacks" | "shaderpacks" | "modpack";

export class MpmPackageSpecifier {
    id: string;
    type: MpmAddonType;
    vendor: string;
    version: string; // An empty string for arbitrary version

    constructor(s: string) {
        const [vendor, type, id, version] = s.split(":");
        this.id = id || "";
        this.type = type as MpmAddonType || "mods";
        this.vendor = vendor || "";
        this.version = version || "";
    }

    toString() {
        return `${this.vendor}:${this.type}:${this.id}:${this.version}`;
    }
}

export interface MpmPackageDependency {
    type: "require" | "conflict";
    spec: string;
}

export interface MpmFile {
    url: string;
    sha1?: string;
    size?: number;
    fileName: string;
}

export interface MpmPackage {
    id: string;
    vendor: string;
    version: string;
    versionName: string;
    spec: string;
    files: MpmFile[];
    dependencies: MpmPackageDependency[];
    meta: MpmAddonMeta;
}

export interface MpmContext {
    gameVersion: string;
    loader: string;
}

export interface MpmManifest {
    userPrompt: string[];
    resolved: MpmPackage[];
}
