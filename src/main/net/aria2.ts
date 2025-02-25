/**
 * Driver for aria2 downloader. aria2 delegates heavy I/O tasks to separated processes and handles all necessary
 * details.
 */
import { conf } from "@/main/conf/conf";
import { paths } from "@/main/fs/paths";
import type { DlxDownloadRequest } from "@/main/net/dlx";
import { WebSocketJsonRpcClient } from "@/main/net/ws-rpc";
import { getExecutableExt } from "@/main/sys/os";
import { exceptions } from "@/main/util/exception";
import { net } from "electron";
import Emittery from "emittery";
import fs from "fs-extra";
import getPort from "get-port";
import child_process from "node:child_process";
import crypto from "node:crypto";
import path from "node:path";
import { pEvent } from "p-event";

let aria2cProcess: child_process.ChildProcess | null = null;
let aria2cToken: string | null = null;
let aria2cPort: number | null = null;
let aria2cRpcClient: WebSocketJsonRpcClient | null = null;
let isAvailable = false;

export interface Aria2DownloadRequest extends DlxDownloadRequest {
    urls: string[];
    origin: string;
    signal?: AbortSignal;
}

const gidEmitters = new Map<string, Emittery>();

/**
 * Preflights and resolves the given request.
 *
 * An error is thrown if the download has failed.
 */
async function resolve(req: Aria2DownloadRequest): Promise<void> {
    console.debug(`Aria2 Get: ${req.origin}`);

    let lastErr: unknown;

    for (let i = 0; i < conf().net.tries; i++) {
        try {
            await sendRequest(req);
            console.debug(`Aria2 Got: ${req.origin}`);
            return;
        } catch (e) {
            lastErr = e;
            console.debug(`Aria2 Try: ${req.origin} (${e})`);
        }
    }

    console.debug(`Aria2 Err: ${req.origin}`);
    throw lastErr;
}

/**
 * Commits the given request to aria2 and wait until it's resolved.
 */
async function sendRequest(req: Aria2DownloadRequest): Promise<void> {
    const dir = path.dirname(req.path);
    const file = path.basename(req.path);

    const checksum = (conf().net.validate && req.sha1) ? { checksum: `sha-1=${req.sha1}` } : {};

    const getGid = aria2cRpcClient?.request("aria2.addUri", [
        `token:${aria2cToken}`,
        req.urls,
        {
            dir,
            out: file, // Filename,
            ...checksum
        }
    ]) as Promise<string>;

    let gid: string;

    if (req.signal) {
        req.signal.addEventListener("abort", () => {
            if (gid) {
                remove(gid);
            }
        }, { once: true });
    }

    gid = await getGid;

    if (req.signal?.aborted) {
        void remove(gid);
        req.signal.throwIfAborted();
    }

    if (!gid) {
        throw "Unable to commit task (empty GID received)";
    }

    const emitter = new Emittery();
    gidEmitters.set(gid, emitter);

    try {
        await pEvent(emitter, "finish");
    } catch {
        // Re-warp the error event
        throw exceptions.create("download", { url: req.url });
    }
}


/**
 * Resolves aria2c executable and check its availability.
 */
async function checkPath(): Promise<string> {
    const execName = "aria2c" + getExecutableExt();
    let exec = execName;

    try {
        const bundled = paths.app.to("vendor", execName);
        await fs.access(bundled);
        await fs.chmod(bundled, 0o777);
        exec = bundled;
    } catch {}

    const proc = child_process.spawn(exec, ["-h"]);

    const code = await pEvent(proc, "exit");

    if (code !== 0) return ""; // Invalid binary

    return exec;
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

        const { requestTimeout } = conf().net;

        const cert = paths.app.to("vendor", "ca-cert.pem");

        aria2cProcess = child_process.spawn(pt, [
            `--quiet=true`, // If not added, the download will stop once the log reaches the limit
            `--max-concurrent-downloads=1024`,
            "--min-split-size=5M",
            "--max-connection-per-server=16",
            `--connect-timeout=${Math.round(requestTimeout / 1000)}`,
            "--enable-rpc=true",
            "--check-integrity=true",
            `--lowest-speed-limit=${conf().net.minSpeed}`,
            "--allow-overwrite=true",
            "--auto-file-renaming=false",
            "--optimize-concurrent-downloads=true",
            `--rpc-listen-port=${aria2cPort}`,
            "--rpc-max-request-size=32M",
            `--rpc-secret=${aria2cToken}`,
            `--ca-certificate=${cert}`
        ], { stdio: "ignore" });

        console.debug("Connecting to aria2 RPC interface...");

        // Polls a request to make sure aria2c server is online before opening WS connection
        await net.fetch(`http://localhost:${aria2cPort}`, { method: "HEAD" });

        const ws = new WebSocket(`ws://localhost:${aria2cPort}/jsonrpc`);

        aria2cRpcClient = new WebSocketJsonRpcClient(ws);
        await aria2cRpcClient.wait();

        const { version } = await aria2cRpcClient.request("aria2.getVersion", ["token:" + aria2cToken]);

        console.log(`Connected to aria2c version ${version}`);

        // Bind event listeners
        aria2cRpcClient.on("aria2.onDownloadComplete", e => notifyComplete(e.gid));
        aria2cRpcClient.on("aria2.onDownloadError", e => void notifyError(e.gid));

        isAvailable = true;
    } catch (e) {
        console.error(`Unable to start aria2c`);
        console.error(e);
    }
}


function extractEmitter(gid: string): Emittery | null {
    const em = gidEmitters.get(gid);
    if (!em) return null;
    gidEmitters.delete(gid);

    return em;
}

function notifyComplete(gid: string) {
    extractEmitter(gid)?.emit("finish");
}

async function notifyError(gid: string) {
    const em = extractEmitter(gid);
    if (!em) return;

    const { errorCode, errorMessage } = await aria2cRpcClient?.request("aria2.tellStatus", [
        "token:" + aria2cToken,
        gid,
        ["errorCode", "errorMessage"]
    ]);

    console.error(`Task ${gid} failed: ${errorCode} (${errorMessage || "?"})`);
    void em.emit("error", `Task ${gid} failed with code ${errorCode} and message ${errorMessage}`);
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
