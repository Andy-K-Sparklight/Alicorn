import fs from "fs-extra";
import path from "path";
import { schedulePromiseTask } from "../../renderer/Schedule";
import { getBoolean } from "../config/ConfigSupport";
import {
  AbstractDownloader,
  DownloadMeta,
  DownloadStatus,
} from "./AbstractDownloader";
import { getConfigOptn } from "./DownloadWrapper";
import { getFileWriteStream, getTimeoutController } from "./RainbowFetch";
import { addRecord } from "./ResolveLock";
import { getHash, getIdentifier } from "./Validate";

export class Serial extends AbstractDownloader {
  private static instance = new Serial();

  static getInstance(): Serial {
    return Serial.instance;
  }

  downloadFile(
    meta: DownloadMeta,
    noTimeout?: boolean
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
            credentials: "omit",
          });

          if (!r.ok) {
            return DownloadStatus.RETRY;
          }
          const f = getFileWriteStream(
            meta.savePath,
            sti,
            () => {
              resolve(DownloadStatus.RETRY); // Break in advance
            },
            noTimeout ? 0 : getConfigOptn("timeout", 3000)
          ); // Require first byte
          if (r.body) {
            await r.body.pipeTo(f);
          } else {
            sti();
            throw "Body is empty!";
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
          return DownloadStatus.RETRY;
        } catch (e) {
          console.log(e);
          // Oops
          return DownloadStatus.RETRY;
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
