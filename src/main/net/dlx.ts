/**
 * A wrapper around NextDL providing mirror chaining and progress tracking.
 */
import { cache } from "@/main/cache/cache";
import { conf } from "@/main/conf/conf";
import { aria2, type Aria2DownloadRequest } from "@/main/net/aria2";
import { mirror } from "@/main/net/mirrors";
import { nextdl, type NextDownloadRequest } from "@/main/net/nextdl";
import { hash } from "@/main/security/hash";
import { isTruthy } from "@/main/util/misc";
import { progress, type ProgressController } from "@/main/util/progress";
import fs from "fs-extra";
import os from "node:os";
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
    // Make the tasks unique to avoid fs operation conflicts
    const cache = new Map<string, DlxDownloadRequest>();

    for (const r of req) {
        cache.set(path.normalize(path.resolve(r.path)), r);
    }

    const uniqueReq = [...cache.values()];

    console.debug(`Preparing to resolve ${uniqueReq.length} tasks.`);

    // Prepare the control values
    const abortController = new AbortController();
    const mixedSignal = AbortSignal.any([abortController.signal, control?.signal].filter(isTruthy));

    // Preflight tasks and filter required ones
    const preflightResult = await Promise.all(uniqueReq.map(preflight));
    const effectiveReq = uniqueReq.filter((_, i) => !preflightResult[i]);

    // Make the requests
    console.debug(`Preflight complete, need to resolve ${effectiveReq.length} tasks.`);

    let promises: Promise<void>[];

    if (aria2.available() && conf().net.allowAria2) {
        const aria2Tasks: Aria2DownloadRequest[] = effectiveReq.map(r => ({
            ...r,
            urls: mirror.apply(r.url),
            origin: r.url,
            signal: mixedSignal
        }));

        promises = aria2Tasks.map(t => aria2.resolve(t));
    } else {
        const nextTasks: NextDownloadRequest[] = effectiveReq.map(r => ({
            ...r,
            urls: mirror.apply(r.url),
            origin: r.url,
            signal: mixedSignal,
            validate: conf().net.validate
        }));

        promises = nextTasks.map(t => nextdl.get(t));
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

    console.debug("Post-processing tasks...");

    const limit = pLimit(os.availableParallelism());
    await Promise.all(effectiveReq.map(r => limit(() => postProcess(r))));

    console.debug("All done.");
}

async function postProcess(req: DlxDownloadRequest): Promise<void> {
    if (req.fastLink) {
        await cache.link(req.path, req.sha1);
    } else {
        await cache.enroll(req.path, req.sha1);
    }
}

async function preflight(req: DlxDownloadRequest): Promise<boolean> {
    try {
        await fs.access(req.path);
        if (!conf().net.validate) return true; // File exists, skipping validation

        if (req.sha1) {
            if (await hash.checkFile(req.path, "sha1", req.sha1)) return true; // File validated
        }
    } catch {}

    // Either the file does not exist, or its integrity cannot be verified

    // Look up the cache, if applicable
    if (req.sha1) {
        if (await cache.deploy(req.path, req.sha1, !!req.fastLink)) return true;
    }

    // A re-download is likely required
    return false;
}

export const dlx = { getAll };
