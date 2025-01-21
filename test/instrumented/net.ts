import { dlx, type DlxDownloadRequest } from "@/main/net/dlx";
import { hash } from "@/main/security/hash";
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
        await dlx.getAll(tasks, {
            onProgress: () => completed++
        });

        assert(completed === 2, "Task count should match");
        assert(await hash.checkFile("assetIndex.json", "sha1", "f3c4aa96e12951cd2781b3e1c0e8ab82bf719cf2"), "Hash 1 should match");
        assert(await hash.checkFile("log.xml", "sha1", "bd65e7d2e3c237be76cfbef4c2405033d7f91521"), "Hash 2 should match");
    });

    await iTest.run("Abort Download", async () => {
        const tasks: DlxDownloadRequest[] = [
            {
                url: "https://piston-meta.mojang.com/v1/packages/0b9d3b6646cb1e3482719b9267ee429dd5e08a1b/5.json",
                path: "should-not-exist.json"
            }
        ];

        const abortController = new AbortController();
        let completed = 0;
        const p = dlx.getAll(tasks, {
            onProgress: () => completed++,
            signal: abortController.signal
        });

        abortController.abort("Cancelled");

        let caught = false;
        try {
            await p;
        } catch {
            caught = true;
        }

        assert(caught, "Should throw error when cancelled");
        assert(completed < 1, "Should abort the download");
    });

    await iTest.run("Error Download", async () => {
        let caught = false;
        try {
            await dlx.getAll([
                {
                    url: "https://httpbin.org/status/404",
                    path: "nothing.txt"
                }
            ]);
        } catch {
            caught = true;
        }

        assert(caught, "Should throw error for invalid HTTP status code");
    });
}
