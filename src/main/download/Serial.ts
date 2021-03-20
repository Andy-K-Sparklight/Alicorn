import {
  AbstractDownloader,
  DownloadMeta,
  DownloadStatus,
} from "./AbstractDownloader";
import fs from "fs-extra";
import path from "path";
import { validate } from "./Validate";
import got from "got";
import { promisify } from "util";
import stream from "stream";
import { isFileExist } from "../config/ConfigSupport";

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
      await pipeline(got.stream(meta.url), fs.createWriteStream(meta.savePath));

      if (await validate(meta.savePath, meta.sha1)) {
        // No error is ok
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
