/**
 * NFAT (Network File Allocation Table) allows Alicorn to reuse downloaded files when a same download request is issued.
 * This does not reduce space consumption but generally reduces number of downloads when installing on multiple containers.
 */
import { conf } from "@/main/conf/conf";
import { paths } from "@/main/fs/paths";
import { hash } from "@/main/security/hash";
import fs from "fs-extra";
import { Database, type Statement } from "node-sqlite3-wasm";
import path from "path";

let db: Database | null = null;

interface FATRecord {
    sha1: string;
    url: string;
    path: string;
}

let enrollStmt: Statement;
let requestStmt: Statement;
let removeStmt: Statement;

async function init() {
    const pt = paths.store.to("fat.arc");
    console.log(`Initializing NFAT database: ${pt}`);

    await fs.ensureDir(path.dirname(pt));

    // Clear the lock as single instance is already guaranteed when starting
    await fs.remove(pt + ".lock");

    db = new Database(pt);

    db.exec("PRAGMA journal_mode = WAL;");
    db.exec(`
        CREATE TABLE IF NOT EXISTS files
        (
            sha1 VARCHAR(40) NOT NULL,
            url  TEXT        NOT NULL,
            path TEXT        NOT NULL
        );
    `);

    enrollStmt = db.prepare(`
        INSERT OR IGNORE INTO files
        VALUES (?, ?, ?);
    `);

    requestStmt = db.prepare(`
        SELECT url, path
        FROM files
        WHERE sha1 = ?;
    `);

    removeStmt = db.prepare(`
        DELETE
        FROM files
        WHERE path = ?;
    `);
}


/**
 * Adds a reusable file after download.
 */
function enroll(fp: string, url: string, sha1: string) {
    if (!conf().net.nfat.enable) return;

    const pt = path.normalize(path.resolve(fp));

    enrollStmt.run([sha1, url, pt]);
}

async function request(url: string, sha1: string): Promise<string | null> {
    const results = requestStmt.all(sha1) as unknown as FATRecord[];

    for (const r of results) {
        if (r.url !== url) continue;

        try {
            await fs.access(r.path);

            const fh = await hash.forFile(r.path, "sha1");
            if (fh.toLowerCase() === sha1.toLowerCase()) {
                // Hash validated, reuse this file
                return r.path;
            }
        } catch {}

        remove(r.path);
    }

    return null;
}

function remove(pt: string) {
    removeStmt.run(pt);
}

/**
 * Tries to find and reuse existing file by copying it to the new location. Returns whether the file
 * has been deployed.
 */
async function deploy(target: string, url: string, sha1: string): Promise<boolean> {
    if (!conf().net.nfat.enable) return false;

    const p = await request(url, sha1);
    if (!p) return false;

    try {
        await fs.ensureDir(path.dirname(target));
        await fs.copyFile(p, target);
        enroll(target, url, sha1); // The copied file can also be reused
        console.debug(`Reused ${p} -> ${target}`);
        return true;
    } catch (e) {
        console.warn(`Unable to reuse file ${p}: ${e}`);
    }

    return false;
}

function close() {
    if (!db) return;

    enrollStmt.finalize();
    requestStmt.finalize();
    removeStmt.finalize();

    db.close();
    db = null;
}

export const nfat = { init, enroll, deploy, close };
