import { CommonModpackModel } from "./CommonModpackModel";

export interface MMCModpackMeta {
  components: MMCComponent[];
}
interface MMCComponent {
  uid: string;
  version: string;
}

export function mmc2common(mmc: MMCModpackMeta): CommonModpackModel {
  return {
    name: "",
    version: "",
    author: "",
    description: "",
    url: "",
    addons: mmc.components.map((c) => {
      if (c.uid.toLowerCase() === "net.minecraft") {
        return { id: "game", version: c.version };
      } else if (c.uid.toLowerCase() === "net.minecraftforge") {
        return { id: "forge", version: c.version };
      } else if (c.uid.toLowerCase() === "net.fabricmc") {
        return { id: "fabric", version: c.version };
      } else {
        return { id: c.uid, version: c.version };
      }
    }),
    overrideSourceDir: ".minecraft",
    files: [],
  };
}
