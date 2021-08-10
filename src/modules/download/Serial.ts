import fs from "fs-extra";
import got from "got";
import path from "path";
import stream from "stream";
import { promisify } from "util";
import { isFileExist } from "../commons/FileUtil";
import {
  AbstractDownloader,
  DownloadMeta,
  DownloadStatus,
} from "./AbstractDownloader";
import { getConfigOptn } from "./DownloadWrapper";
import { addRecord } from "./ResolveLock";
import { getHash, getIdentifier, validate } from "./Validate";

const pipeline = promisify(stream.pipeline);

export class Serial extends AbstractDownloader {
  private static instance = new Serial();

  static getInstance(): Serial {
    return Serial.instance;
  }

  async downloadFile(meta: DownloadMeta): Promise<DownloadStatus> {
    try {
      // If file already exists then check if HASH matches
      if (meta.sha1 !== "" && (await isFileExist(meta.savePath))) {
        if (await validate(meta.savePath, meta.sha1)) {
          return DownloadStatus.RESOLVED;
        }
      }
      // Ensure directory
      await fs.ensureDir(path.dirname(meta.savePath));

      // Pipe data
      await pipeline(
        got.stream(meta.url, {
          timeout: getConfigOptn("timeout", 5000),
          https: {
            rejectUnauthorized: false,
          },
        }),
        fs.createWriteStream(meta.savePath)
      );

      if (meta.sha1 === "") {
        return DownloadStatus.RESOLVED;
      }
      const h = await getHash(meta.savePath);
      if (meta.sha1 === h) {
        // No error is ok, add record
        const id = await getIdentifier(meta.savePath);
        if (id.length > 0) {
          addRecord(id, meta.url);
        }
        return DownloadStatus.RESOLVED;
      }

      // Mismatch
      return DownloadStatus.RETRY;
    } catch {
      // Oops
      return DownloadStatus.RETRY;
    }
  }
}
