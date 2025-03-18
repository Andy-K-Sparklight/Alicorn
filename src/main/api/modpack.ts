import { addCheckedHandler } from "@/main/ipc/checked";
import { modpacks } from "@/main/modpack/common";

addCheckedHandler("readModpack", async fp => {
    try {
        return await modpacks.loadPackMeta(fp);
    } catch (e) {
        console.error(`Unable to read modpack meta from ${fp}`);
        console.error(e);
        return null;
    }
});

addCheckedHandler("deployModpack", async fp => {
    await modpacks.deploy(fp);
});
