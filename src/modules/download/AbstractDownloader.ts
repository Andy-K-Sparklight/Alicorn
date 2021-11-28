import path from "path";

export abstract class AbstractDownloader {
  abstract downloadFile(meta: DownloadMeta): Promise<DownloadStatus>;
}

export class DownloadMeta {
  readonly url: string;
  readonly savePath: string;
  readonly sha1: string;
  readonly size: number;
  constructor(url: string, savePath: string, sha1 = "", size = 0) {
    this.url = url;
    this.savePath = path.isAbsolute(savePath)
      ? path.normalize(savePath)
      : path.resolve(savePath);
    this.sha1 = sha1;
    this.size = size;
  }
}

enum DownloadStatus {
  RESOLVED = 1,
  RETRY = 0, // But not timeout
  FATAL = -1,
  TIMEOUT = -3,
}

export { DownloadStatus };
