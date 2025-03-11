import { conf } from "@/main/conf/conf";
import pkg from "~/package.json";

const ALICORN_CANONICAL_UA = `Alicorn/${pkg.version}`;

export function getCanonicalUA(): string {
    if (conf().analytics.hideUA) {
        const fakeUAs = import.meta.env.AL_FAKE_UAS;
        return fakeUAs[Math.floor(Math.random() * fakeUAs.length)];
    } else {
        return ALICORN_CANONICAL_UA;
    }
}
