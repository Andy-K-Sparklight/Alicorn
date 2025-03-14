import { vanillaInstaller } from "@/main/install/vanilla";
import { addCheckedHandler } from "@/main/ipc/checked";

addCheckedHandler("getVersionManifest", () => vanillaInstaller.getManifest());
