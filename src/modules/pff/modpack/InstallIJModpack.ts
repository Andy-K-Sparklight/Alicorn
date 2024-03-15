import { copy, readJSON } from "fs-extra";
import path from "path";
import { MinecraftContainer } from "../../container/MinecraftContainer";

export async function deployIJPack(
    c: MinecraftContainer,
    src: string
): Promise<void> {
    const p = await readJSON(src);
    await copy(src, path.join(c.getVersionRoot(String(p.id || "")), p + ".json"));
}
