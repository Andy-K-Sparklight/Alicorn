/**
 * Driver for aria2 downloader. aria2 delegates heavy I/O tasks to separated processes and handles all necessary
 * details.
 */
import { conf } from "@/main/conf/conf";
import { paths } from "@/main/fs/paths";
import { dlchk } from "@/main/net/dlchk";
import { nfat } from "@/main/net/nfat";
import { WebSocketJsonRpcClient } from "@/main/net/rpc";
import { getExecutableExt } from "@/main/sys/os";
import childProcess from "child_process";
import crypto from "crypto";
import { net } from "electron";
import EventEmitter from "events";
import fs from "fs-extra";
import getPort from "get-port";
import child_process from "node:child_process";
import { pEvent } from "p-event";
import path from "path";
import type TypedEventEmitter from "typed-emitter";
import type TypedEmitter from "typed-emitter";
import { WebSocket } from "ws";

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
    signal?: AbortSignal;
}

type Aria2TaskEvents = {
    finish: () => void;
    error: (e: string) => void;
}

const gidEmitters = new Map<string, TypedEmitter<Aria2TaskEvents>>();

/**
 * Preflights and resolves the given request.
 *
 * An error is thrown if the download has failed.
 */
async function resolve(req: Aria2DownloadRequest): Promise<void> {
    console.debug(`Aria2 Get: ${req.origin}`);

    if (req.sha1) {
        await nfat.deploy(req.path, req.origin, req.sha1);
    }

    // Preflight
    const pref = await dlchk.validate({ ...req });

    if (pref === "checked") {
        return; // Completed
    }

    req.signal?.throwIfAborted();

    // Remove the file before downloading or aria2c will complain
    await fs.remove(req.path);

    try {
        await sendRequest(req);
        console.debug(`Aria2 Got: ${req.origin}`);
    } catch (e) {
        console.debug(`Aria2 Err: ${req.origin} (${e})`);
        throw e;
    }
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
            "allow-overwrite": true,
            "auto-file-renaming": false,
            "max-tries": conf().net.aria2.tries ?? 3,
            ...checksum
        }
    ]) as Promise<string>;
    
    if (req.signal) {
        Promise.all([getGid, pEvent(req.signal, "abort")]).then(([lateGID]) => remove(lateGID));
    }

    const gid = await getGid;

    if (!gid) {
        throw "Unable to commit task (empty GID received)";
    }

    const emitter = new EventEmitter() as TypedEventEmitter<Aria2TaskEvents>;

    gidEmitters.set(gid, emitter);

    await pEvent(emitter, "finish");

    if (req.sha1) {
        nfat.enroll(req.path, req.origin, req.sha1);
    }
}


/**
 * Resolves aria2c executable and check its availability.
 */
async function checkPath(): Promise<string> {
    const execName = "aria2c" + getExecutableExt();
    let exec = execName;

    if (import.meta.env.AL_ENABLE_BUNDLED_ARIA2) {
        exec = paths.app.to("vendor", execName);
        await fs.chmod(exec, 0o777);
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

        const { args, requestTimeout, transferTimeout } = conf().net.aria2;
        const concurrency = conf().net.concurrency;

        const cert = paths.app.to("vendor", "ca-cert.pem");

        aria2cProcess = child_process.spawn(pt, [
            `--max-concurrent-downloads=${concurrency > 1 ? concurrency : 1}`,
            "--max-connection-per-server=16",
            `--connect-timeout=${requestTimeout}`,
            `--timeout=${transferTimeout}`,
            "--enable-rpc=true",
            `--rpc-listen-port=${aria2cPort}`,
            "--rpc-max-request-size=32M",
            `--rpc-secret=${aria2cToken}`,
            `--ca-certificate=${cert}`,
            ...args.split("\n").map(a => a.trim()).filter(Boolean)
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


function extractEmitter(gid: string): TypedEventEmitter<Aria2TaskEvents> | null {
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
    em.emit("error", `Task ${gid} failed with code ${errorCode} and message ${errorMessage}`);
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