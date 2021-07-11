import os from "os";
import got from "got";
import { load } from "cheerio";
import { getActualDataPath } from "../config/DataSupport";
import { wrappedDownloadFile } from "../download/DownloadWrapper";
import { DownloadMeta } from "../download/AbstractDownloader";
import childProcess from "child_process";

const JDK_BASE_URL = "https://mirror.tuna.tsinghua.edu.cn/AdoptOpenJDK/";
const OLD_JAVA = "8";
const NEW_JAVA = "16";

// Currently we cannot support *nix users
export async function getLatestJREURL(old = false): Promise<string> {
  if (os.platform() !== "win32") {
    throw new Error("Does not support this platform!");
  }
  const bits = os.arch();
  let cv = "";
  if (bits === "ia32") {
    cv = "x32";
  } else if (bits === "x64") {
    cv = "x64";
  } else {
    throw new Error("Does not support this arch!");
  }
  const u = `${JDK_BASE_URL}${old ? OLD_JAVA : NEW_JAVA}/jre/${cv}/windows/`;
  const res = await got.get(u, {
    https: {
      rejectUnauthorized: false,
    },
    responseType: "text",
  });
  const X = load(res.body);
  const ls = X("table#list > tbody > tr");
  if (ls.length === 0) {
    return "";
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
      if (typeof s === "string" && s.endsWith(".msi")) {
        all.push(s);
      }
    }
    // First OpenJ9
    for (const a of all) {
      if (a.includes("openj9")) {
        resolve(u + a);
        return;
      }
    }
    // Then Hotspot
    for (const a of all) {
      if (a.includes("hotspot")) {
        resolve(u + a);
        return;
      }
    }
  });
}

async function downloadAndStartJREInstaller(u: string): Promise<void> {
  const tD = getActualDataPath("jre_installer_tmp.msi");
  const s = await wrappedDownloadFile(new DownloadMeta(u, tD, ""));
  if (s === 1) {
    childProcess.exec(tD);
  } else {
    throw new Error("Could not download!");
  }
}

export async function installJRE(old = false): Promise<void> {
  const u = await getLatestJREURL(old);
  const url = new URL(u);
  await downloadAndStartJREInstaller(url.toString());
}
