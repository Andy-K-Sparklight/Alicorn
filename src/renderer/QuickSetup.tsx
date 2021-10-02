import { Box, LinearProgress, Typography } from "@material-ui/core";
import os from "os";
import path from "path";
import React, { useState } from "react";
import { set } from "../modules/config/ConfigSupport";
import { getContainer } from "../modules/container/ContainerUtil";
import { createNewContainer } from "../modules/container/ContainerWrapper";
import {
  downloadJREInstaller,
  getLatestJREURL,
  waitJREInstaller,
} from "../modules/java/GetJDK";
import {
  getAllJava,
  getJavaInfoRaw,
  parseJavaInfo,
  parseJavaInfoRaw,
  setDefaultJavaHome,
} from "../modules/java/JInfo";
import { whereJava } from "../modules/java/WhereJava";
import {
  downloadProfile,
  getProfileURLById,
} from "../modules/pff/get/MojangCore";
import { jumpTo, triggerSetPage } from "./GoTo";
import { submitError } from "./Message";
import { fullWidth, useTextStyles } from "./Stylex";
import { tr } from "./Translator";

let clickable = true;
export function QuickSetup(): JSX.Element {
  const [state, setState] = useState("Start");
  const classes = useTextStyles();
  const fullWidthProgress = fullWidth();
  return (
    <Box
      style={{
        textAlign: "center",
        marginTop: "10%",
      }}
      onClick={async () => {
        try {
          if (clickable) {
            clickable = false;
            setState("CreatingContainer");
            await createNewContainer(
              getMCDefaultRootDir(),
              tr("QuickSetup.Default") || "Minecraft"
            );
            if (os.platform() === "win32") {
              setState("ConfiguringJava");
              const j8 = await getLatestJREURL(true);
              const j16 = await getLatestJREURL(false);
              await Promise.all([
                downloadJREInstaller(j8),
                downloadJREInstaller(j16),
              ]);
              setState("InstallingJava");
              await waitJREInstaller(j8);
              await waitJREInstaller(j16);
              setState("ConfiguringJava");
              await whereJava(true);
              let a = "";
              await Promise.allSettled(
                getAllJava().map(async (j) => {
                  const jf = parseJavaInfo(
                    parseJavaInfoRaw(await getJavaInfoRaw(j))
                  );
                  if (jf.rootVersion >= 16) {
                    a = j;
                  }
                })
              );
              setDefaultJavaHome(a || getAllJava()[0] || "");
            }
            setState("InstallingCore");
            const ct = getContainer("Minecraft");
            const u = await getProfileURLById("1.17.1");
            await downloadProfile(u, ct, "1.17.1");
            setState("Done");
            await wait(5000);
            set("startup-page.name", "Welcome");
            set("startup-page.url", "/Welcome");
            jumpTo("/Welcome");
            triggerSetPage("Welcome");
            window.dispatchEvent(new CustomEvent("refreshApp"));
          }
        } catch (e) {
          submitError(String(e));
          setState("Error");
        }
      }}
      className={classes.root}
    >
      <br />
      <Typography color={"primary"} className={classes.firstText} gutterBottom>
        {tr("QuickSetup." + state)}
      </Typography>
      <br />
      {["Start", "Done"].includes(state) ? (
        ""
      ) : (
        <LinearProgress
          color={"secondary"}
          style={{ width: "80%" }}
          className={fullWidthProgress.progress}
        />
      )}
    </Box>
  );
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

function wait(ms: number): Promise<void> {
  return new Promise<void>((res) => {
    setTimeout(() => {
      res();
    }, ms);
  });
}
