/**
 * Utilities for progress-tracking.
 */

/**
 * Possible types of progress listed.
 */
export type ProgressStateName =
    "generic.download" | "generic.count" |
    "jrt.download" | "jrt.unpack" | "jrt.verify" |
    "vanilla.download-libs" | "vanilla.unpack-libs"

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

/**
 * Unifies abort signal and progress handler in one interface.
 */
export interface ProgressController {
    onProgress?: ProgressHandler;
    signal?: AbortSignal;
}

/**
 * Creates a new handler that forwards underlying progress events to the given parent, with state set to the new name.
 */
function makeNamed(src: ProgressHandler | undefined, state: ProgressStateName): ProgressHandler | undefined {
    if (src) {
        return (p: Progress) => {
            src({ ...p, state });
        };
    }
    return undefined;
}

function countPromises<T>(p: Promise<T>[], onProgress?: ProgressHandler): Promise<T>[] {
    if (!onProgress) return p;

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
    countPromises,
    makeNamed
};

