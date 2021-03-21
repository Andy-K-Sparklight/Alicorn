import { DownloadMeta, DownloadStatus } from "./AbstractDownloader";
import { Concurrent } from "./Concurrent";
import { Serial } from "./Serial";
import { applyMirror } from "./Mirror";

// Download one file
// Mirror will be applied here
// There are no options for user to choose downloader
// Concurrent will always be used first
// If file already exists, downloader will resolve if hash matches
export async function wrappedDownloadFile(
  meta: DownloadMeta
): Promise<DownloadStatus> {
  const mirroredMeta = new DownloadMeta(
    applyMirror(meta.url),
    meta.savePath,
    meta.sha1
  );
  if (
    (await Concurrent.getInstance().downloadFile(mirroredMeta)) ===
    DownloadStatus.RESOLVED
  ) {
    return DownloadStatus.RESOLVED;
  }
  return await Serial.getInstance().downloadFile(mirroredMeta);
}
