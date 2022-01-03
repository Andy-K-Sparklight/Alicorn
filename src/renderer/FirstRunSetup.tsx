import os from "os";
import path from "path";
import { getBoolean, set } from "../modules/config/ConfigSupport";
import { getContainer } from "../modules/container/ContainerUtil";
import { createNewContainer } from "../modules/container/ContainerWrapper";
import { installBothJDKs } from "../modules/java/BuiltInJDK";
import {
  getAllJava,
  getJavaInfoRaw,
  parseJavaInfo,
  parseJavaInfoRaw,
  setDefaultJavaHome,
} from "../modules/java/JavaInfo";
import { whereJava } from "../modules/java/WhereJava";
import {
  downloadProfile,
  getLatestMojangCore,
  getProfileURLById,
} from "../modules/pff/get/MojangCore";
import { isInstBusy, startInst } from "./Instruction";
import { checkToGoAndDecideJump, loadToGoHook } from "./linkage/AlicornToGo";
import { submitInfo, submitWarn } from "./Message";
import { tr } from "./Translator";
export function waitInstDone(): Promise<void> {
  return new Promise<void>((res) => {
    if (!isInstBusy()) {
      res();
      return;
    }
    const fun = () => {
      window.removeEventListener("InstructionEnd", fun);
      res();
    };
    window.addEventListener("InstructionEnd", fun);
  });
}

async function waitJavaSearch(): Promise<boolean> {
  const r = await whereJava(true, true);
  if (r.length > 0) {
    return true;
  }
  return false;
}

export async function completeFirstRun(): Promise<void> {
  if (!getBoolean("first-run?")) {
    await checkToGoAndDecideJump();
    return;
  }
  await createNewContainer(
    getMCDefaultRootDir(),
    tr("FirstRun.Default") || "Minecraft"
  );
  const ct = getContainer(tr("FirstRun.Default") || "Minecraft");
  const lv = await getLatestMojangCore();
  const u = await getProfileURLById(lv);
  await Promise.allSettled([
    setupFirstJavaCheckAndCheckToGo(),
    downloadProfile(u, ct, lv),
  ]);
  set("first-run?", false);
}

function getMCDefaultRootDir(): string {
  switch (os.platform()) {
    case "win32":
      return path.join(
        process.env["APPDATA"] || path.join(os.homedir(), "AppData", "Roaming"),
        ".minecraft"
      );
    case "darwin":
      return path.join(
        os.homedir(),
        "Library",
        "Application Support",
        "minecraft"
      );
    case "linux":
    default:
      return path.join(os.homedir(), ".minecraft");
  }
}

async function setupFirstJavaCheckAndCheckToGo(): Promise<void> {
  submitInfo(tr("FirstRun.Preparing"));
  let s = false;
  void (async () => {
    s = await waitJavaSearch();
  })();
  await waitInstDone();
  if (!s) {
    startInst("NoJava");
    await waitInstDone();
    submitInfo(tr("FirstRun.FetchingJava"));
    if (await installBothJDKs()) {
      submitInfo(tr("FirstRun.JavaInstalled"));
    } else {
      submitWarn(tr("FirstRun.JavaFailed"));
    }
  } else {
    startInst("JavaOK");
  }
  // Delegate this task
  void whereJava(true)
    .then(async () => {
      let a = "";
      submitInfo(tr("FirstRun.ConfiguringJava"));
      await Promise.allSettled(
        getAllJava().map(async (j) => {
          const jf = parseJavaInfo(parseJavaInfoRaw(await getJavaInfoRaw(j)));
          if (jf.rootVersion >= 17) {
            a = j;
          }
        })
      );
      setDefaultJavaHome(a || getAllJava()[0] || "");
      submitInfo(tr("FirstRun.JavaConfigured"));
    })
    .catch(() => {});
  await waitInstDone();
  if (await loadToGoHook()) {
    startInst("HavePack");
    await waitInstDone();
    await checkToGoAndDecideJump();
  }
}
