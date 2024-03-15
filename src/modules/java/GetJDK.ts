import { load } from "cheerio";
import os from "os";

const JDK_BASE_URL = "https://mirror.tuna.tsinghua.edu.cn/Adoptium/";
const OLD_JAVA = "8";
const NEW_JAVA = "17";

// Currently we cannot support *nix users
export async function getLatestJREURL(old = false): Promise<string> {
    const plat = os.platform() === "win32" ? "windows" : "linux";
    const bits = os.arch();
    let cv = "";
    if (bits === "ia32") {
        cv = "x32";
    } else if (bits === "x64") {
        cv = "x64";
    } else if (bits === "arm64") {
        cv = "aarch64";
    } else {
        throw new Error("Does not support this arch!");
    }
    let u = `${JDK_BASE_URL}${old ? OLD_JAVA : NEW_JAVA}/jre/${cv}/${plat}/`;
    let res = await fetch(u, {
        method: "GET",
        credentials: "omit"
    });
    let X = load(await res.text());
    let ls = X("table#list > tbody > tr");
    if (ls.length === 0) {
        u = `${JDK_BASE_URL}${old ? OLD_JAVA : NEW_JAVA}/jdk/${cv}/${plat}/`;
        res = await fetch(u, {
            method: "GET",
            credentials: "omit"
        });
        X = load(await res.text());
        ls = X("table#list > tbody > tr");
        if (ls.length === 0) {
            return "";
        }
    }
    return new Promise<string>((resolve) => {
        const all = [];
        for (const e of ls.get()) {
            const s = X(e)
                .children("td.link")
                .first()
                .children("a")
                .first()
                .attr("href");
            if (
                typeof s === "string" &&
                s.endsWith(plat === "windows" ? ".zip" : ".tar.gz")
            ) {
                all.push(s);
            }
        }
        // First OpenJ9
        for (const a of all) {
            if (a.includes("openj9") && a.toLowerCase().includes("openjdk")) {
                resolve(u + a);
                return;
            }
        }
        // Then Hotspot
        for (const a of all) {
            if (a.includes("hotspot") && a.toLowerCase().includes("openjdk")) {
                resolve(u + a);
                return;
            }
        }
        // Finally others
        resolve(all[0] || "");
    });
}
