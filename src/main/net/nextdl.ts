/**
 * The next generation download module designed for Alicorn.
 *
 * Comparing to the wrapped downloader, the next downloader runs on the main process and utilizes the net module from
 * Electron. This is expected to bypass the connection limit in the browser window and maximize the throughput.
 */
import { conf } from "@/main/conf/conf";
import type { DlxDownloadRequest } from "@/main/net/dlx";
import { hash } from "@/main/security/hash";
import { exceptions } from "@/main/util/exception";
import { isTruthy } from "@/main/util/misc";
import { net } from "electron";
import Emittery from "emittery";
import fs from "fs-extra";
import path from "node:path";
import { Stream } from "node:stream";
import { pEvent } from "p-event";

/**
 * A network-level download request for fetching the given resources and save them to the given path.
 */
export interface NextDownloadRequest extends DlxDownloadRequest {
    urls: string[];
    origin: string;
    validate?: boolean;
    signal?: AbortSignal;
}

export interface NextDownloadTask {
    req: NextDownloadRequest;
    signal?: AbortSignal;
    emitter: Emittery;

    // The current active URL
    activeURL: string;
    tries: number;
}

/**
 * Internal status enum indicating the result of a transfer request.
 */
enum NextRequestStatus {
    SUCCESS,
    RETRY,
    FATAL
}

const pendingTasks: NextDownloadTask[] = [];
const runningTasks = new Set<NextDownloadTask>();

/**
 * Resolves the download task for the maximum number of tries specified.
 */
async function get(req: NextDownloadRequest): Promise<void> {
    const task = createTask(req);
    pendingTasks.push(task);
    pollTasks();

    await pEvent(task.emitter, "finish");
}

function pollTasks() {
    while (runningTasks.size < conf().net.concurrency) {
        const t = pendingTasks.shift();
        if (!t) break;

        runningTasks.add(t);
        beginWork(t).then(pollTasks);
    }
}

async function beginWork(task: NextDownloadTask) {
    if (task.tries >= conf().net.tries) {
        // Choose the next URL
        const url = task.req.urls.shift();
        if (!url) {
            // Failed
            console.warn(`NextDL Err: ${task.req.origin}`);
            const ex = exceptions.create("download", { url: task.req.origin });
            void task.emitter.emit("error", ex);
            return;
        }

        task.activeURL = url;
    } else {
        task.tries++;
    }

    console.debug(`NextDL Get: ${task.req.origin} (Using ${task.activeURL})`);

    const st = await resolveOnce(task);

    runningTasks.delete(task);

    if (st === NextRequestStatus.SUCCESS) {
        // Resolved
        console.debug(`NextDL Got: ${task.req.origin} (Using ${task.activeURL})`);
        void task.emitter.emit("finish");
        return;
    } else if (st === NextRequestStatus.FATAL) {
        // Skip the tries
        console.debug(`NextDL Ign: ${task.req.origin} (Skipping ${task.activeURL})`);
        task.tries = Number.MAX_SAFE_INTEGER;
    } else {
        console.debug(`NextDL Try: ${task.req.origin} (Tried ${task.activeURL}, ${task.tries}x)`);
    }

    // Add the task to the pending queue
    pendingTasks.push(task);
}

/**
 * Resolves the download task once.
 */
async function resolveOnce(task: NextDownloadTask): Promise<NextRequestStatus> {
    if (task.signal?.aborted) return NextRequestStatus.FATAL;

    const res = await retrieve(task);

    if (res === NextRequestStatus.SUCCESS) {
        if (task.req.validate && task.req.sha1) {

            return await hash.checkFile(task.req.path, "sha1", task.req.sha1) ? NextRequestStatus.SUCCESS : NextRequestStatus.RETRY;
        } else {
            return NextRequestStatus.SUCCESS;
        }
    }

    return res;
}

/**
 * Creates a task based on the given request.
 */
function createTask(req: NextDownloadRequest): NextDownloadTask {
    if (req.urls.length === 0) throw "No URL specified";

    return {
        req: {
            ...req,
            path: path.resolve(req.path)
        },
        activeURL: req.urls[0],
        signal: req.signal,
        emitter: new Emittery(),
        tries: 0
    };
}

/**
 * Starts a request to the task URL and tries to fetch its content.
 */
async function retrieve(task: NextDownloadTask): Promise<NextRequestStatus> {
    const { requestTimeout, minSpeed } = conf().net;

    const ac = new AbortController();

    const signal = AbortSignal.any([task.signal, ac.signal].filter(isTruthy));

    let res: Response | null = null;

    const timer = requestTimeout > 0 && setTimeout(() => {
        if (!res) { // Avoid aborting the request too early
            ac.abort("Request timed out");
        }
    }, requestTimeout);

    try {
        res = await net.fetch(task.activeURL, {
            credentials: "omit",
            signal
        });

        if (timer) {
            clearTimeout(timer);
        }

        if (!res.ok || !res.body) {
            if (res.status >= 400 && res.status < 500) {
                console.warn(`Irrecoverable status code: ${res.status}`);
                return NextRequestStatus.FATAL; // When encountering such status code a retry may only bring limited effect
            }
            console.warn(`Unexpected status code: ${res.status}`);
            return NextRequestStatus.RETRY;
        }
    } catch (e) {
        console.warn(`Fetch request failed: ${e}`);
        return NextRequestStatus.RETRY;
    }


    try {
        await fs.ensureFile(task.req.path);
        const writeStream = Stream.Writable.toWeb(fs.createWriteStream(task.req.path)) as WritableStream<Uint8Array>;
        const guardStream = createTransferGuardStream(minSpeed);
        await res.body.pipeThrough(guardStream).pipeTo(writeStream);
        return NextRequestStatus.SUCCESS;
    } catch (e) {
        console.warn(`Error when transferring data: ${e}`);
        return NextRequestStatus.RETRY;
    }
}

/**
 * Creates a transform stream which counts bytes transferred and aborts the transfer when the speed is slower than the
 * given limit.
 */
function createTransferGuardStream(minSpeed: number): TransformStream<Uint8Array, Uint8Array> {
    let lastUpdateTime = Date.now();
    let tries = 0;
    return new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
            const currentTime = Date.now();
            const speed = chunk.byteLength / ((currentTime - lastUpdateTime) / 1000);
            lastUpdateTime = currentTime;

            if (speed < minSpeed) {
                tries++;
                if (tries >= 3) {
                    controller.error(`Transfer speed too slow (${minSpeed}B/s)`);
                    return;
                }
            } else {
                tries = 0;
            }
            controller.enqueue(chunk);
        }
    });
}

export const nextdl = { get };
