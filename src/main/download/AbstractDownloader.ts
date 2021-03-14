export abstract class AbstractDownloader {
  abstract downloadFile(meta: DownloadMeta): Promise<DownloadStatus>;
}

export class DownloadMeta {
  readonly url: string;
  readonly savePath: string;
  readonly sha1: string;

  constructor(url: string, savePath: string, sha1: string) {
    this.url = url;
    this.savePath = savePath;
    this.sha1 = sha1;
  }
}

enum DownloadStatus {
  RESOLVED,
  FAILED,
}

export { DownloadStatus };
