import { promisify } from "node:util";
import { getNative } from "@/main/native-loader";

interface LzmaInflatePool {
    inflate(src: string, dst: string): Promise<void>;
}

/**
 * Create a Rust-managed LZMA worker pool.
 */
function createPool(threads?: number): LzmaInflatePool {
    const handle = new (getNative().LzmaInflatePoolHandle)(threads);

    const inflate: (src: string, dst: string) => Promise<void> = promisify(
        (src: string, dst: string, callback: (err: Error | null) => void) => {
            handle.inflate(src, dst, callback);
        },
    );

    return {
        inflate,
    };
}

export const lzma = { createPool };
