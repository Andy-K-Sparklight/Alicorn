import fs from "fs-extra";
import path from "path";
import { getBoolean } from "../config/ConfigSupport";
import { AbstractDownloader, DownloadMeta, DownloadStatus } from "./AbstractDownloader";
import { getConfigOptn } from "./DownloadWrapper";
import { getFileWriteStream, getTimeoutController } from "./RainbowFetch";
import { getHash } from "./Validate";

export class Serial extends AbstractDownloader {
    private static instance = new Serial();

    static getInstance(): Serial {
        return Serial.instance;
    }

    downloadFile(
        meta: DownloadMeta,
        noTimeout?: boolean,
        fetchRequire = false
    ): Promise<DownloadStatus> {
        return new Promise<DownloadStatus>((resolve, reject) => {
            (async () => {
                try {
                    // If file already exists then check if HASH matches
                    /* if (meta.sha1 !== "" && (await isFileExist(meta.savePath))) {
                      if (await validate(meta.savePath, meta.sha1, meta.size)) {
                        return DownloadStatus.RESOLVED;
                      }
                    } */
                    // Ensure directory
                    await fs.ensureDir(path.dirname(meta.savePath));
                    const [ac, sti] = getTimeoutController(
                        noTimeout ? 0 : getConfigOptn("timeout", 3000)
                    );
                    const r = await fetch(meta.url, {
                        method: "GET",
                        signal: ac.signal,
                        keepalive: true,
                        credentials: "omit"
                    });

                    if (!r.ok) {
                        return DownloadStatus.RETRY; // Mark as bad
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let f: WritableStream;
                    try {
                        f = getFileWriteStream(
                            meta.savePath,
                            sti,
                            () => {
                                resolve(DownloadStatus.TIMEOUT); // Break in advance
                            },
                            noTimeout ? 0 : getConfigOptn("timeout", 3000)
                        ); // Require first byte
                    } catch {
                        return DownloadStatus.FATAL;
                    }
                    if (r.body) {
                        try {
                            await r.body.pipeTo(f);
                        } catch (e) {
                            try {
                                await fs.remove(meta.savePath);
                            } catch {}
                            console.log(e);
                            throw e;
                        }
                    } else {
                        sti();
                        throw "Body is empty!";
                    }
                    if (meta.sha1 === "" || getBoolean("download.skip-validate")) {
                        return DownloadStatus.RESOLVED;
                    }
                    const h = await getHash(meta.savePath);
                    if (meta.sha1 === h) {
                        // No error is ok
                        return DownloadStatus.RESOLVED;
                    }

                    // Mismatch
                    return DownloadStatus.RETRY; // Hash mismatch, bad url!
                } catch (e) {
                    console.log(e);
                    // Oops, probably timeout
                    return DownloadStatus.TIMEOUT;
                }
            })().then((b) => {
                resolve(b);
            }).catch((e) => {
                console.log(e);
                reject(e);
            });
        });
    }
}
