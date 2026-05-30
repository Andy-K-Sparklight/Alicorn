import path from "node:path";
import fs from "fs-extra";

export async function linkAll(src: string, dst: string): Promise<void> {
    const st = await fs.stat(src);
    if (st.isFile()) {
        await fs.link(src, dst);
        return;
    }

    if (st.isDirectory()) {
        const files = await fs.readdir(src);
        await fs.ensureDir(dst);

        for (const f of files) {
            await linkAll(path.join(src, f), path.join(dst, f));
        }
    }
}
