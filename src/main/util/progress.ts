/**
 * Utilities for progress-tracking.
 */

/**
 * Interface describing generic progress.
 */
export interface Progress {
    type: "indefinite" | "size" | "count";
    value: {
        current: number;
        total: number;
    };
}

export interface ProgressReceiver {
    onProgress: (p: Progress) => void;
}