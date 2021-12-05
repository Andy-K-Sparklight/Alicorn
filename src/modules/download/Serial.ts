import { once } from "events";
import fs from "fs-extra";
import path from "path";
import { pipeline } from "stream/promises";
import { schedulePromiseTask } from "../../renderer/Schedule";
import { getBoolean, getString } from "../config/ConfigSupport";
import {
  AbstractDownloader,
  DownloadMeta,
  DownloadStatus,
} from "./AbstractDownloader";
import { getPool } from "./Connections";
import { getConfigOptn } from "./DownloadWrapper";
import {
  getFileWriteStream,
  getGuardStream,
  getTimeoutController,
} from "./RainbowFetch";
import { addRecord } from "./ResolveLock";
import { getHash, getIdentifier } from "./Validate";

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
          if (
            fetchRequire ||
            getString("download.lib").toLowerCase() === "fetch" ||
            !["direct://", ""].includes(
              getString("download.global-proxy").trim()
            )
          ) {
            const r = await fetch(meta.url, {
              method: "GET",
              signal: ac.signal,
              keepalive: true,
              credentials: "omit",
            });

            if (!r.ok) {
              return DownloadStatus.RETRY; // Mark as bad
            }
            const f = getFileWriteStream(
              meta.savePath,
              sti,
              () => {
                resolve(DownloadStatus.TIMEOUT); // Break in advance
              },
              noTimeout ? 0 : getConfigOptn("timeout", 3000)
            ); // Require first byte
            if (r.body) {
              try {
                await r.body.pipeTo(f);
              } catch (e) {
                try {
                  await fs.remove(meta.savePath);
                } catch {}
                throw e;
              }
            } else {
              sti();
              throw "Body is empty!";
            }
          } else {
            const p = getPool(meta.url);
            if (!p) {
              throw "Invalid URL! " + meta.url;
            }
            const u = new URL(meta.url);
            const res = await p.request({
              path: u.pathname,
              method: "GET",
              signal: ac.signal,
              maxRedirections: 20,
            });
            sti();
            if (res.statusCode < 200 || res.statusCode >= 300) {
              return DownloadStatus.RETRY;
            }
            const f = fs.createWriteStream(meta.savePath);
            const gs = getGuardStream(
              res.body,
              f,
              noTimeout ? 0 : getConfigOptn("timeout", 3000)
            );
            const p1 = once(f, "close");
            try {
              await Promise.all([pipeline(res.body, gs, f), p1]);
            } catch (e) {
              try {
                await fs.remove(meta.savePath);
              } catch {}
              throw e;
            }
          }
          if (meta.sha1 === "" || getBoolean("download.skip-validate")) {
            void (async (meta) => {
              const id = await schedulePromiseTask(() => {
                return getIdentifier(meta.savePath);
              });
              if (id.length > 0) {
                addRecord(id, meta.url);
              }
            })(meta); // 'Drop' this promise
            return DownloadStatus.RESOLVED;
          }
          const h = await getHash(meta.savePath);
          if (meta.sha1 === h) {
            // No error is ok, add record
            void (async (meta) => {
              const id = await schedulePromiseTask(() => {
                return getIdentifier(meta.savePath);
              });
              if (id.length > 0) {
                addRecord(id, meta.url);
              }
            })(meta); // 'Drop' this promise
            return DownloadStatus.RESOLVED;
          }

          // Mismatch
          return DownloadStatus.RETRY; // Hash mismatch, bad url!
        } catch (e) {
          console.log(e);
          // Oops, probably timeout
          return DownloadStatus.TIMEOUT;
        }
      })()
        .then((b) => {
          resolve(b);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }
}
