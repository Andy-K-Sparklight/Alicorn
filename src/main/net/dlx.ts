/**
 * A wrapper around NextDL providing mirror chaining and progress tracking.
 */
import { conf } from "@/main/conf/conf";
import { aria2, type Aria2DownloadRequest } from "@/main/net/aria2";
import { mirror } from "@/main/net/mirrors";
import { nextdl, type NextDownloadRequest } from "@/main/net/nextdl";
import { isTruthy } from "@/main/util/misc";
import { progress, type ProgressController } from "@/main/util/progress";
import path from "node:path";
import pLimit from "p-limit";

export interface DlxDownloadRequest {
    url: string;
    path: string;
    sha1?: string;
    size?: number;

    /**
     * Whether to link the file (instead of copying) when found in cache.
     */
    fastLink?: boolean;
    noCache?: true;
}

/**
 * Resolves all given download requests with mirrors applied.
 */
async function getAll(req: DlxDownloadRequest[], control?: ProgressController): Promise<void> {
    // Make the tasks unique or conflicts will happen
    const cache = new Map<string, DlxDownloadRequest>();

    for (const r of req) {
        cache.set(path.normalize(path.resolve(r.path)), r);
    }

    req = [...cache.values()];

    let dl = conf().net.downloader;
    if (dl === "aria2" && !aria2.available()) {
        dl = "next";
    }

    const abortController = new AbortController();
    const mixedSignal = AbortSignal.any([abortController.signal, control?.signal].filter(isTruthy));

    console.log(`Resolving ${req.length} tasks (${dl}).`);

    let limit = pLimit(conf().net.concurrency);
    let promises: Promise<void>[];

    if (dl === "aria2") {
        const aria2Tasks: Aria2DownloadRequest[] = req.map(r => ({
            ...r,
            urls: mirror.apply(r.url),
            origin: r.url,
            signal: mixedSignal
        }));

        promises = aria2Tasks.map(t => limit(() => aria2.resolve(t)));

    } else if (dl === "nextdl") {
        const nextTasks: NextDownloadRequest[] = req.map(r => ({
            ...r,
            urls: mirror.apply(r.url),
            origin: r.url,
            signal: mixedSignal
        }));

        promises = nextTasks.map(t => limit(() => nextdl.get(t)));

    } else {
        throw `Unknown downloader: ${dl}`;
    }


    try {
        await Promise.all(progress.countPromises(
            promises,
            progress.makeNamed(control?.onProgress, "generic.download")
        ));
    } catch (e) {
        console.debug("Cancelling other tasks in the same group due to previous error.");
        abortController.abort("Error occurred in other task(s)");
        throw e;
    }
}

export const dlx = { getAll };
