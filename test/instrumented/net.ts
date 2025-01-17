import { dlx, type DlxDownloadRequest } from "@/main/net/dlx";
import { nfat } from "@/main/net/nfat";
import { hash } from "@/main/security/hash";
import fs from "fs-extra";
import assert from "node:assert";
import { iTest } from "~/test/instrumented/tools";

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
        await dlx.getAll(tasks, () => {
            completed++;
        });

        assert(completed === 2, "Task count should match");
        assert(await hash.checkFile("assetIndex.json", "sha1", "f3c4aa96e12951cd2781b3e1c0e8ab82bf719cf2"), "Hash 1 should match");
        assert(await hash.checkFile("log.xml", "sha1", "bd65e7d2e3c237be76cfbef4c2405033d7f91521"), "Hash 2 should match");
    });

    await iTest.run("NFAT File Reuse", async () => {
        const src = "NFAT speeds up the download";
        const fp = "nfat-data.txt";
        const url = "https://example.com/nfat-data.txt";
        await fs.writeFile(fp, src);
        const h = await hash.forFile(fp, "sha1");
        nfat.enroll(fp, url, h);

        await nfat.deploy("reuse-data.txt", url, h);
        const dat = await fs.readFile("reuse-data.txt");
        assert(dat.toString() === src);
    });
}
