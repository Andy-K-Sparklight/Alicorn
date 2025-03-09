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
