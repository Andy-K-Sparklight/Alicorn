/**
 * Driver for aria2 downloader. aria2 delegates heavy I/O tasks to separated processes and handles all necessary
 * details.
 */
import childProcess from "child_process";
import crypto from "crypto";
import { paths } from "@/main/fs/paths";
import { getExecutableExt } from "@/main/sys/os";
import child_process from "node:child_process";
import getPort from "get-port";
import { conf } from "@/main/conf/conf";
import { WebSocketJsonRpcClient } from "@/main/net/rpc";
import { WebSocket } from "ws";
import { net } from "electron";
import path from "path";
import { dlchk } from "@/main/net/dlchk";
import fs from "fs-extra";
import { nfat } from "@/main/net/nfat";

let aria2cProcess: childProcess.ChildProcess | null = null;
let aria2cToken: string | null = null;
let aria2cPort: number | null = null;
let aria2cRpcClient: WebSocketJsonRpcClient | null = null;
let isAvailable = false;

export interface Aria2DownloadRequest {
    urls: string[];
    origin: string;
    path: string;
    sha1?: string;
    size?: number;
}

// Maps task GIDs to corresponding listener.
const taskResolvers = new Map<string, (r: boolean) => void>();

/**
 * Preflights and resolves the given request.
 */
async function resolve(req: Aria2DownloadRequest): Promise<[Promise<boolean>, string]> {
    if (req.sha1) {
        await nfat.deploy(req.path, req.origin, req.sha1);
    }


    // Preflight
    const pref = await dlchk.validate({ ...req });

    if (pref === "checked") {
        // noinspection ES6MissingAwait
        return [Promise.resolve(true), ""];
    }

    // Remove the file before downloading or aria2c will complain
    await fs.remove(req.path);

    return await commit(req);
}

/**
 * Commits the given request to aria2 and wait until it's resolved.
 */
async function commit(req: Aria2DownloadRequest): Promise<[Promise<boolean>, string]> {
    const dir = path.dirname(req.path);
    const file = path.basename(req.path);

    const checksum = (conf().net.aria2.validate && req.sha1) ? { checksum: `sha-1=${req.sha1}` } : {};

    const gid = await aria2cRpcClient?.request("aria2.addUri", [
        `token:${aria2cToken}`,
        req.urls,
        {
            dir,
            out: file, // Filename,
            "allow-overwrite": true,
            "auto-file-renaming": false,
            "max-tries": conf().net.aria2.tries ?? 3,
            ...checksum
        }
    ]);

    if (!gid) {
        // noinspection ES6MissingAwait
        return [Promise.resolve(false), ""];
    }

    console.debug(`Committed aria2 task ${gid}`);

    const p = new Promise<boolean>((res) => {
        taskResolvers.set(gid, (b: boolean) => {
            if (req.sha1) {
                nfat.enroll(req.path, req.origin, req.sha1);
            }
            res(b);
        });
    });

    return [p, gid];
}


/**
 * Resolves aria2c executable and check its availability.
 */
async function checkPath(): Promise<string> {
    const execName = "aria2c" + getExecutableExt();
    let exec = execName;

    if (import.meta.env.AL_ENABLE_BUNDLED_ARIA2) {
        exec = paths.app.to("vendor", execName);
    }

    const proc = child_process.spawn(exec, ["-h"]);

    return await new Promise((res) => {
        proc.once("error", () => res(""));
        proc.once("exit", (code) => res(code === 0 ? exec : ""));
    });
}

async function init() {
    console.log("Starting aria2c daemon...");

    try {
        const pt = await checkPath();
        if (!pt) {
            console.log("No aria2c binaries found, skipped.");
            return;
        }

        console.debug(`Picked aria2c executable: ${pt}`);

        aria2cToken = createToken();
        aria2cPort = await getPort({ port: 6800 });

        console.debug(`Using port for aria2c: ${aria2cPort}`);

        const { concurrency, args, requestTimeout, transferTimeout } = conf().net.aria2;

        aria2cProcess = child_process.spawn(pt, [
            `--max-concurrent-downloads=${concurrency}`,
            "--max-connection-per-server=16",
            `--connect-timeout=${requestTimeout}`,
            `--timeout=${transferTimeout}`,
            "--enable-rpc=true",
            `--rpc-listen-port=${aria2cPort}`,
            "--rpc-max-request-size=32M",
            `--rpc-secret=${aria2cToken}`,
            ...args.split("\n").filter(Boolean)
        ]);

        console.debug("Connecting to aria2 RPC interface...");

        // Polls a request to make sure aria2c server is online before opening WS connection
        await net.fetch(`http://localhost:${aria2cPort}`, { method: "HEAD" });

        const ws = new WebSocket(`ws://localhost:${aria2cPort}/jsonrpc`);

        aria2cRpcClient = new WebSocketJsonRpcClient(ws);
        await aria2cRpcClient.wait();

        const { version } = await aria2cRpcClient.request("aria2.getVersion", ["token:" + aria2cToken]);

        console.log(`Connected to aria2c version ${version}`);

        // Bind event listeners
        aria2cRpcClient.on("aria2.onDownloadComplete", ({ gid }) => notifyComplete(gid));
        aria2cRpcClient.on("aria2.onDownloadError", ({ gid }) => void notifyError(gid));

        isAvailable = true;
    } catch (e) {
        console.error(`Unable to start aria2c`);
        console.error(e);
    }
}


function notifyComplete(gid: string) {
    const res = taskResolvers.get(gid);
    if (!res) return;
    taskResolvers.delete(gid);
    res(true);
}

async function notifyError(gid: string) {
    const res = taskResolvers.get(gid);
    if (!res) return;
    taskResolvers.delete(gid);

    const { errorCode, errorMessage } = await aria2cRpcClient?.request("aria2.tellStatus", [
        "token:" + aria2cToken,
        gid,
        ["errorCode", "errorMessage"]
    ]);

    console.error(`Task ${gid} failed: ${errorCode} (${errorMessage || "?"})`);
    res(false);
}

function createToken() {
    return crypto.randomUUID().toString().replaceAll("-", "");
}

function shutdown() {
    aria2cProcess?.kill();
}

function available() {
    return isAvailable;
}

/**
 * Removes the task with the given GID. Errors are ignored.
 */
async function remove(gid: string) {
    try {
        await aria2cRpcClient?.request("aria2.remove", [
            "token:" + aria2cToken,
            gid
        ]);
    } catch {}
}

export const aria2 = {
    available,
    init,
    resolve,
    shutdown,
    remove
};