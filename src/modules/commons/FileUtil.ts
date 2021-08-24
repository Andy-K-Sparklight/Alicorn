import fs from "fs-extra";
import path from "path";

export async function isFileExist(pt: string): Promise<boolean> {
  if (pt.length === 0) {
    return false; // Null safe
  }
  try {
    const s = await fs.stat(pt);
    return s.isDirectory() || s.size > 0;
  } catch {
    return false;
  }
}

export async function getModifiedDate(f: string): Promise<Date> {
  try {
    return (await fs.stat(path.resolve(f))).mtime;
  } catch {
    return new Date();
  }
}

export async function copyFileStream(
  from: string,
  dest: string
): Promise<void> {
  if (!(await isFileExist(from))) {
    throw new Error("File Not Exist: " + from);
  }
  const dPath = path.resolve(dest);
  await fs.ensureDir(path.dirname(dPath));
  const stream = fs
    .createReadStream(path.resolve(from))
    .pipe(fs.createWriteStream(dPath, { mode: 0o777 }));
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
