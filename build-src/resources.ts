import consola from "consola";
import path from "node:path";
import type { BuildConfig } from "~/config";
import { linkAll } from "./util";
import { vendor } from "./vendor";

export async function processResources(cfg: BuildConfig): Promise<void> {
    const { outputDir } = cfg;

    consola.start("res: linking app resources");
    await linkAll("resources", outputDir);

    consola.start("res: processing vendored files");
    await vendor.prepareAssets(cfg, path.join(outputDir, "vendor"));

    consola.start("res: linking native addons");
    const platform = cfg.variant.platform + "-" + cfg.variant.arch;

    if (cfg.enableNativeLZMA) {
        try {
            await linkAll(`node_modules/lzma-native/prebuilds/${platform}`, path.join(outputDir, `natives/lzma-native/prebuilds/${platform}`));
        } catch (e) {
            consola.error("Unable to link lzma-native prebuilt binaries. (Is it supported?)");
            throw e;
        }
    }
}
