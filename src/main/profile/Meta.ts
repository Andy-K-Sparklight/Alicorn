export class ArtifactMeta {
  url: string;
  sha1: string;
  path: string;

  constructor(url: string, sha1: string, path: string) {
    this.url = url;
    this.sha1 = sha1;
    this.path = path;
  }
}

export class AssetIndexMeta {}
