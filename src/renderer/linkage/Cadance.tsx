import { Button, Container, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/styles";
import cp, { execFile } from "child_process";
import { tar } from "compressing";
import { remove } from "fs-extra";
import os from "os";
import { join } from "path";
import React, { useEffect, useState } from "react";
import { chkPermissions, isFileExist } from "../../modules/commons/FileUtil";
import { getBoolean, set } from "../../modules/config/ConfigSupport";
import { getPathInDefaults } from "../../modules/config/DataSupport";
import { getBasePath } from "../../modules/config/PathSolve";
import { DownloadMeta } from "../../modules/download/AbstractDownloader";
import { Serial } from "../../modules/download/Serial";
import { submitError, submitInfo, submitSucc } from "../Message";
import {
  ALICORN_DEFAULT_THEME_DARK,
  ALICORN_DEFAULT_THEME_LIGHT,
  isBgDark,
} from "../Renderer";
import { useTextStyles } from "../Stylex";
import { randsl, tr } from "../Translator";

const CADANCE_WIN =
  "https://pan.bilnn.com/api/v3/file/sourcejump/Z9akG3so/rFsXy5oA6P5Xy-PwvUifI7wIWJVIT_LhiyzADTqZ9Vs*";

const CADANCE_GNU =
  "https://pan.bilnn.com/api/v3/file/sourcejump/DoaDvDc9/dqiTxBjq0iOl8w96IjbmlCTFrP3O2E_0kGtWagxWkhg*";

let CADANCE_PROC: cp.ChildProcess;

export function CadanceControlPanel(): JSX.Element {
  const classes = useTextStyles();
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(getBoolean("interactive.cadance"));
  const [isRunning, setRunning] = useState(false);
  const [voice, setVoice] = useState("");
  const [word, setWord] = useState(randsl("Cadance.TestWord"));
  const compatible = !(os.platform() === "win32" && os.arch() !== "x64");
  useEffect(() => {
    if (voice === word) {
      setWord(randsl("Cadance.TestWord"));
    }
  }, [voice]);
  useEffect(() => {
    const fun = (e: Event) => {
      if (e instanceof CustomEvent) {
        setVoice(String(e.detail).replaceAll(" ", ""));
      }
    };
    window.addEventListener("CadanceInput", fun);
    return () => {
      window.removeEventListener("CadanceInput", fun);
    };
  }, []);
  useEffect(() => {
    void (async () => {
      setAvailable(await detectCadance());
    })();
  }, []);
  return (
    <ThemeProvider
      theme={
        isBgDark() ? ALICORN_DEFAULT_THEME_DARK : ALICORN_DEFAULT_THEME_LIGHT
      }
    >
      <Container>
        <Typography className={classes.secondText} gutterBottom>
          {tr("Cadance.Desc")}
        </Typography>
        <br />
        <Typography className={classes.secondText} gutterBottom>
          {tr(
            compatible
              ? available
                ? enabled
                  ? "Cadance.Enabled"
                  : "Cadance.Disabled"
                : "Cadance.NotInstalled"
              : "Cadance.NotCompatible"
          )}
        </Typography>
        <br />
        {compatible ? (
          <Button
            color={"primary"}
            variant={"contained"}
            disabled={isRunning}
            onClick={async () => {
              if (available) {
                if (enabled) {
                  set("interactive.cadance", false);
                  setEnabled(false);
                  terminateCadanceProc();
                } else {
                  set("interactive.cadance", true);
                  setEnabled(true);
                  await startCadanceProc();
                }
              } else {
                try {
                  setRunning(true);
                  submitInfo(tr("Cadance.Installing"));
                  await enableCadanceFeature();
                  set("interactive.cadance", true);
                  setEnabled(true);
                  setAvailable(true);
                  await startCadanceProc();
                  submitSucc(tr("Cadance.InstallOK"));
                } catch {
                  submitError(tr("Cadance.FailedToInstall"));
                }
              }
            }}
          >
            {tr(
              available
                ? enabled
                  ? "Cadance.Disable"
                  : "Cadance.Enable"
                : "Cadance.Install"
            )}
          </Button>
        ) : (
          ""
        )}
        {available && enabled ? (
          <Container sx={{ textAlign: "center" }}>
            <Typography className={classes.secondText}>
              {tr("Cadance.VoiceTest")}
            </Typography>
            <br />
            <Typography className={classes.firstText}>{word}</Typography>
            <Typography className={classes.secondText}>
              {tr("Cadance.Voice", `Voice=${voice}`)}
            </Typography>
            <br />
            <Typography className={classes.secondText}>
              {tr("Cadance.VoiceTestHint")}
            </Typography>
          </Container>
        ) : (
          ""
        )}
      </Container>
    </ThemeProvider>
  );
}

export async function startCadanceProc(): Promise<void> {
  try {
    if (!getBoolean("interactive.cadance")) {
      console.log("Cadance disabled, skipped.");
      return;
    }
    if (!(await detectCadance())) {
      console.log("Cadance not installed, skipped.");
      return;
    }
    const cadance = join(
      getBasePath(),
      "Cadance",
      os.platform() === "win32" ? "Cadance.exe" : "Cadance"
    );
    const cadanceDir = join(getBasePath(), "Cadance");
    CADANCE_PROC = cp.spawn(cadance, { cwd: cadanceDir });
    console.log("Cadance started.");
    CADANCE_PROC.stdout?.on("data", (msg) => {
      const inp = String(msg.toString());
      if (!inp.includes("text")) {
        return;
      }
      try {
        const obj = JSON.parse(inp);
        if (obj.text) {
          const pj = obj.text.replaceAll(/\[[A-Z]{3}\]/g, "");
          if (pj.length > 1) {
            // Partial will be dropped
            window.dispatchEvent(
              new CustomEvent("CadanceInput", { detail: pj })
            );
          }
        }
      } catch {}
    });
  } catch (e) {
    console.log("Could not start Cadance: " + e);
  }
}

export function terminateCadanceProc(): void {
  CADANCE_PROC?.kill();
}

export async function enableCadanceFeature(): Promise<void> {
  let u = CADANCE_GNU;
  if (os.platform() === "win32") {
    u = CADANCE_WIN;
  }
  const target = join(getBasePath(), "Cadance.tar.xz");
  if (
    (await Serial.getInstance().downloadFile(
      new DownloadMeta(u, target),
      true,
      true
    )) === 1
  ) {
    const odir = join(getBasePath(), "Cadance.tar");
    const output = join(getBasePath(), "Cadance");
    await remove(output);
    await xzDecompressFile(target);
    await tar.uncompress(odir, output);
    await remove(odir);
  } else {
    throw "Download failed!";
  }
}

export async function detectCadance(): Promise<boolean> {
  const cadance = join(
    getBasePath(),
    "Cadance",
    os.platform() === "win32" ? "Cadance.exe" : "Cadance"
  );
  if (!(await isFileExist(cadance))) {
    return false;
  }
  return await chkPermissions(cadance, true);
}

function xzDecompressFile(source: string): Promise<void> {
  return new Promise<void>((res, rej) => {
    if (os.platform() === "win32") {
      execFile(getPathInDefaults("xz.ald"), ["-d", source], (e) => {
        if (e) {
          rej(e);
        } else {
          res();
        }
      });
    } else {
      execFile("xz", ["-d", source], (e) => {
        if (e) {
          rej(e);
        } else {
          res();
        }
      });
    }
  });
}
