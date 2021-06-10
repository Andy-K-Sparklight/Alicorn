import {
  AbstractDownloader,
  DownloadMeta,
  DownloadStatus,
} from "./AbstractDownloader";
import fs from "fs-extra";
import path from "path";
import { getHash, validate } from "./Validate";
import got from "got";
import { promisify } from "util";
import stream from "stream";
import { isFileExist } from "../commons/FileUtil";
import { getNumber } from "../config/ConfigSupport";
import { addRecord } from "./ResolveLock";

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
          timeout: getNumber("download.concurrent.timeout", 5000),
        }),
        fs.createWriteStream(meta.savePath)
      );

      if (meta.sha1 === "") {
        return DownloadStatus.RESOLVED;
      }
      const h = await getHash(meta.savePath);
      if (meta.sha1 === h) {
        // No error is ok, add record
        addRecord(h, meta.url);
        return DownloadStatus.RESOLVED;
      }

      // Mismatch
      return DownloadStatus.FAILED;
    } catch {
      // Oops
      return DownloadStatus.FAILED;
    }
  }
}
