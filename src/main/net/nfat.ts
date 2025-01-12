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

let db: Database;

interface FATRecord {
    sha1: string;
    url: string;
    path: string;
}

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
}

const statements: Statement[] = [];
let enrollStmt: Statement;
let requestStmt: Statement;
let removeStmt: Statement;

/**
 * Adds a reusable file after download.
 */
function enroll(fp: string, url: string, sha1: string) {
    if (!conf().net.nfat.enable) return;

    if (!enrollStmt) {
        enrollStmt = db.prepare(`
            INSERT OR IGNORE INTO files
            VALUES (?, ?, ?);
        `);
        statements.push(enrollStmt);
    }

    const pt = path.normalize(path.resolve(fp));

    enrollStmt.run([sha1, url, pt]);
}

async function request(url: string, sha1: string): Promise<string | null> {
    if (!requestStmt) {
        requestStmt = db.prepare(`
            SELECT url, path
            FROM files
            WHERE sha1 = ?;
        `);

        statements.push(requestStmt);
    }

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
    if (!removeStmt) {
        removeStmt = db.prepare(`
            DELETE
            FROM files
            WHERE path = ?;
        `);
        statements.push(removeStmt);
    }

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
    statements.forEach(s => s.isFinalized || s.finalize());
    db?.close();
}

export const nfat = { init, enroll, deploy, close };