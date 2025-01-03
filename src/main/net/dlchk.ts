import fs from "fs-extra";
import { hash } from "@/main/security/hash";

type ValidateResult = "checked" | "unknown" | "failed";

/**
 * Validates the integrity of the file.
 */
async function validate(init: { path: string, sha1?: string, size?: number }): Promise<ValidateResult> {
    try {
        const st = await fs.stat(init.path);

        if (init.sha1) {
            const h = await hash.forFile(init.path, "sha1");
            return h.toLowerCase() === init.sha1.toLowerCase() ? "checked" : "failed";
        } else if (init.size && init.size > 0) {
            return st.size === init.size ? "checked" : "failed";
        }

        return "unknown";
    } catch (e) {
        // Unable to access file
        return "failed";
    }
}


export const dlchk = { validate };