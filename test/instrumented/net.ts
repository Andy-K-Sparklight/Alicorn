import { iTest } from "~/test/instrumented/tools";
import { dlx, type DlxDownloadRequest } from "@/main/net/dlx";
import assert from "node:assert";
import { hash } from "@/main/security/hash";

export async function checkFileDownload() {
    await iTest.run("File Download", async () => {
        const tasks: DlxDownloadRequest[] = [
            {
                url: "https://piston-meta.mojang.com/v1/packages/f3c4aa96e12951cd2781b3e1c0e8ab82bf719cf2/1.16.json",
                sha1: "f3c4aa96e12951cd2781b3e1c0e8ab82bf719cf2",
                size: 295227,
                path: "assetIndex.json"
            },
            {
                url: "https://piston-data.mojang.com/v1/objects/bd65e7d2e3c237be76cfbef4c2405033d7f91521/client-1.12.xml",
                sha1: "bd65e7d2e3c237be76cfbef4c2405033d7f91521",
                size: 888,
                path: "log.xml"
            }
        ];

        let completed = 0;
        await dlx.getAll(tasks, {
            onProgress(p) {
                completed = p.value.current;
            }
        });

        assert(completed === 2, "Task count should match");
        assert(await hash.forFile("assetIndex.json", "sha1") === "f3c4aa96e12951cd2781b3e1c0e8ab82bf719cf2", "Hash 1 should match");
        assert(await hash.forFile("log.xml", "sha1") === "bd65e7d2e3c237be76cfbef4c2405033d7f91521", "Hash 2 should match");
    });
}
