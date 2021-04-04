import fs from "fs-extra";
import path from "path";

export async function isFileExist(pt: string): Promise<boolean> {
  try {
    await fs.access(pt);
    return true;
  } catch {
    return false;
  }
}

export async function copyFileStream(
  from: string,
  dest: string
): Promise<void> {
  const dPath = path.resolve(dest);
  await fs.ensureDir(path.dirname(dPath));
  const stream = fs
    .createReadStream(path.resolve(from))
    .pipe(fs.createWriteStream(dPath));
  return new Promise<void>((resolve, reject) => {
    stream.on("finish", () => {
      resolve();
    });
    stream.on("error", (e) => {
      reject(e);
    });
  });
}

export async function wrappedLoadJSON(
  fPath: string,
  def: Record<string, unknown>
): Promise<Record<string, unknown>> {
  try {
    const s = await fs.readFile(fPath);
    return JSON.parse(s.toString());
  } catch {
    return def;
  }
}
