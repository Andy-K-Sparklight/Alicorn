import fs from "fs-extra";
import path from "path";

export async function alterPath(...pt: string[]): Promise<string> {
    for (const p of pt) {
        if (await chkPermissions(p)) {
            return p;
        }
    }
    return "";
}

async function chkDirExist(pt: string): Promise<boolean> {
    try {
        await fs.access(pt, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

export async function chkPermissions(
    pt: string,
    exec = false
): Promise<boolean> {
    while (!(await chkDirExist(pt))) {
        const opt = pt;
        pt = path.dirname(pt);
        if (opt === pt) {
            break;
        }
    }
    try {
        await fs.access(pt, fs.constants.R_OK);
        await fs.access(pt, fs.constants.W_OK);
        if (exec) {
            await fs.access(pt, fs.constants.X_OK);
        }
        // Not meant to be executable
        return true;
    } catch {}
    try {
        await fs.chmod(pt, 0o777);
        return true;
    } catch {}
    return false;
}

export async function isFileExist(pt: string): Promise<boolean> {
    if (pt.length === 0) {
        return false; // Null safe
    }
    try {
        await fs.access(pt, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

export async function isFileExistAndNonEmpty(pt: string): Promise<boolean> {
    try {
        const s = await fs.lstat(pt);
        if (s.isSymbolicLink()) {
            return false;
        }
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
