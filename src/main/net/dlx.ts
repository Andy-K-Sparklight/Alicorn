/**
 * A wrapper around NextDL providing mirror chaining and progress tracking.
 */
import { conf } from "@/main/conf/conf";
import { aria2, type Aria2DownloadRequest } from "@/main/net/aria2";
import { mirror } from "@/main/net/mirrors";
import { nextdl, type NextDownloadRequest } from "@/main/net/nextdl";
import { progress, type ProgressHandler } from "@/main/util/progress";

export interface DlxDownloadRequest {
    url: string;
    path: string;
    sha1?: string;
    size?: number;
}

export interface DlxInit {
    onProgress?: ProgressHandler;
    abortSignal?: AbortSignal;
}

/**
 * Resolves all given download requests with mirrors applied.
 */
async function getAll(req: DlxDownloadRequest[], init?: DlxInit): Promise<void> {
    let dl = conf().net.downloader;
    if (dl === "aria2" && !aria2.available()) {
        dl = "next";
    }

    const abortController = new AbortController();
    const mixedSignal = AbortSignal.any([abortController.signal, init?.abortSignal].filter(Boolean) as AbortSignal[]);

    console.log(`Resolving ${req.length} tasks (${dl}).`);

    let promises: Promise<void>[];

    if (dl === "aria2") {
        const aria2Tasks: Aria2DownloadRequest[] = req.map(r => ({
            ...r,
            urls: mirror.apply(r.url),
            origin: r.url,
            signal: mixedSignal
        }));

        promises = aria2Tasks.map(t => aria2.resolve(t));

    } else if (dl === "next") {
        const nextTasks: NextDownloadRequest[] = req.map(r => ({
            ...r,
            urls: mirror.apply(r.url),
            origin: r.url,
            signal: mixedSignal
        }));

        promises = nextTasks.map(t => nextdl.get(t));

    } else {
        throw `Unknown downloader: ${dl}`;
    }


    try {
        await Promise.all(progress.countPromises(
            promises,
            p => init?.onProgress?.({ ...p, state: "generic.download" })
        ));
    } catch (e) {
        console.debug("Cancelling other tasks in the same group due to previous error.");
        abortController.abort("Error occurred in other task(s)");
        throw e;
    }
}

export const dlx = { getAll };