/**
 * Utilities for progress-tracking.
 */

/**
 * Possible types of progress listed.
 */
export type ProgressStateName = "generic.download" | "generic.count" | "jrt.download" | "jrt.unpack" | "jrt.verify"

/**
 * Interface describing generic progress.
 */
export interface Progress {
    state: ProgressStateName;
    type: "indefinite" | "size" | "count";
    value: {
        current: number;
        total: number;
    };
}

/**
 * Progress handler function.
 */
export type ProgressHandler = (progress: Progress) => void;

function countPromises<T>(p: Promise<T>[], onProgress: ProgressHandler): Promise<T>[] {
    const po: Progress = {
        state: "generic.count",
        type: "count",
        value: {
            current: 0,
            total: p.length
        }
    };
    return p.map(pr => pr.then((r) => {
        po.value.current++;
        onProgress(po);
        return r;
    }));
}

export const progress = {
    countPromises
};

