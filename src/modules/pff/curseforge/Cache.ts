/*
export async function hasCachedFile(
  file: File,
  addon: AddonInfo,
  cacheRoot: string
): Promise<boolean> {
  try {
    let TARGET_FILE = path.join(
      cacheRoot,
      GLOBAL_CACHE_NAME,
      GLOBAL_FILE_NAME,
      addon.id.toString(16),
      file.id.toString(16),
      objectHash(file.fileDate)
    );
  } catch {
    return false;
  }
}
*/
