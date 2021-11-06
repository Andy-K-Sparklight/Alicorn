import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  MuiThemeProvider,
  Select,
  Tooltip,
  Typography,
} from "@material-ui/core";
import { Refresh } from "@material-ui/icons";
import { ipcRenderer, shell } from "electron";
import os from "os";
import path from "path";
import React, { useEffect, useRef, useState } from "react";
import { installJRE } from "../modules/java/GetJDK";
import {
  getAllJava,
  getDefaultJavaHome,
  getJavaInfoRaw,
  JavaInfo,
  parseJavaInfo,
  parseJavaInfoRaw,
  resetJavaList,
  setDefaultJavaHome,
} from "../modules/java/JInfo";
import { whereJava } from "../modules/java/WhereJava";
import { setChangePageWarn } from "./GoTo";
import { ShiftEle } from "./Instruction";
import { submitError, submitInfo } from "./Message";
import { ALICORN_DEFAULT_THEME_LIGHT } from "./Renderer";
import { fullWidth, useFormStyles } from "./Stylex";
import { tr } from "./Translator";

export const CANNOT_LOAD_INFO: JavaInfo = {
  rootVersion: -1,
  vm: "",
  vmSide: "Server",
  bits: "64",
  isFree: true,
  runtime: "",
  version: "",
};

export function JavaSelector(): JSX.Element {
  const classes = useFormStyles();
  const fullWidthClasses = fullWidth();
  const [isJavaInfoLoaded, setLoaded] = useState<boolean>(true);
  const mounted = useRef<boolean>(false);
  const [javaList, setJavaList] = useState<string[]>(getAllJava());
  const [javaInfo, setJavaInfo] = useState<Map<string, JavaInfo>>(new Map());
  const [currentJava, setCurrentJava] = useState<string>(getDefaultJavaHome());
  const [currentJavaInfo, setCurrentJavaInfo] =
    useState<JavaInfo>(CANNOT_LOAD_INFO);
  const [refreshBit, setRefreshBit] = useState<boolean>(false);
  useEffect(() => {
    mounted.current = true;

    void (async () => {
      try {
        const t = parseJavaInfo(
          parseJavaInfoRaw(await getJavaInfoRaw(currentJava))
        );
        if (mounted.current) {
          setCurrentJavaInfo(t);
        }
      } catch {
        if (mounted.current) {
          setCurrentJavaInfo(CANNOT_LOAD_INFO);
        }
      }
    })();

    return () => {
      mounted.current = false;
    };
  }, [refreshBit]);
  useEffect(() => {
    void (async () => {
      setChangePageWarn(true);
      let javas;
      if (!isJavaInfoLoaded) {
        javas = await whereJava();
      } else {
        javas = getAllJava();
      }
      if (mounted.current) {
        if (!isJavaInfoLoaded) {
          resetJavaList(javas);
        }
        setJavaList(javas);
        const tMap: Map<string, JavaInfo> = new Map();
        for (const j of javas) {
          try {
            tMap.set(
              j,
              parseJavaInfo(parseJavaInfoRaw(await getJavaInfoRaw(j)))
            );
          } catch {
            tMap.set(j, CANNOT_LOAD_INFO);
          }
        }
        if (mounted.current) {
          setJavaInfo(tMap);
          if (currentJava.trim().length === 0 && javas.length > 0) {
            // If not selected then select
            setCurrentJava(javas[0] || "");
          }
        }
        setLoaded(true);
      }
      setChangePageWarn(false);
    })();
  }, [isJavaInfoLoaded, refreshBit]);
  return (
    <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
      <Box className={classes.root}>
        <br />
        <br />

        <FormControl variant={"outlined"}>
          <InputLabel id={"Select-JRE"} className={classes.label}>
            {tr("JavaSelector.SelectJava")}
          </InputLabel>

          <ShiftEle name={"JavaSelectorSelect"} bgfill>
            <Select
              label={tr("JavaSelector.SelectJava")}
              variant={"outlined"}
              labelId={"Select-JRE"}
              color={"primary"}
              className={classes.selector + " " + fullWidthClasses.form}
              onChange={(e) => {
                const sj = String(e.target.value);
                setCurrentJava(sj);
                setDefaultJavaHome(sj);
              }}
              value={currentJava}
            >
              {javaList.map((j) => {
                return (
                  <MenuItem key={j} value={j}>
                    {j}
                  </MenuItem>
                );
              })}
            </Select>
          </ShiftEle>
        </FormControl>

        <Tooltip
          title={
            <Typography className={"smtxt"}>
              {tr("JavaSelector.Reload")}
            </Typography>
          }
        >
          <IconButton
            color={"primary"}
            className={fullWidthClasses.right}
            onClick={() => {
              setLoaded(false);
            }}
          >
            <ShiftEle name={"JavaSelectorSelect"} bgfill>
              <Refresh />
            </ShiftEle>
          </IconButton>
        </Tooltip>
        <br />
        <br />
        <ShiftEle name={"JavaSelectorManual"}>
          <Button
            variant={"contained"}
            color={"primary"}
            onClick={() => {
              void (async () => {
                const d = path.dirname(path.dirname(await remoteSelectJava()));
                if (d === "." || d.length === 0) {
                  return;
                }
                if (mounted.current) {
                  const jlCopy = javaList.concat();
                  if (!jlCopy.includes(d)) {
                    jlCopy.push(d);
                    setJavaList(jlCopy);
                    resetJavaList(jlCopy);
                    setRefreshBit(!refreshBit);
                  }
                  setCurrentJava(d);
                }
              })();
            }}
          >
            {tr("JavaSelector.CustomAdd")}
          </Button>
        </ShiftEle>
        <br />
        <br />
        {isJavaInfoLoaded ? (
          ""
        ) : (
          <>
            <LinearProgress color={"secondary"} />
            <br />
            <Typography className={classes.text} color={"primary"} gutterBottom>
              {tr("JavaSelector.Loading")}
            </Typography>
          </>
        )}

        <JavaInfoDisplay
          jInfo={isJavaInfoLoaded ? javaInfo.get(currentJava) : currentJavaInfo}
        />
        <JavaDownloader />
      </Box>
    </MuiThemeProvider>
  );
}

function JavaInfoDisplay(props: { jInfo?: JavaInfo }): JSX.Element {
  const corruptBit =
    props.jInfo?.rootVersion === -1 || props.jInfo === undefined;
  return (
    <>
      <Typography variant={"h6"} color={"primary"} gutterBottom>
        {corruptBit
          ? tr("JavaSelector.CannotLoad")
          : `Java ${props.jInfo?.rootVersion || 0}`}
      </Typography>
      {corruptBit ? (
        ""
      ) : (
        <>
          <Typography color={"secondary"} gutterBottom>
            {props.jInfo?.runtime || "Unknown"}
          </Typography>
          <Typography color={"secondary"} gutterBottom>
            {props.jInfo?.vm || "Unknown"}
          </Typography>
        </>
      )}
      {corruptBit ? (
        <Typography
          style={{
            color: "#ff8400",
          }}
          className={"smtxt"}
          gutterBottom
        >
          {tr("JavaSelector.CannotLoadDetail")}
        </Typography>
      ) : (
        ""
      )}
      {corruptBit ? (
        ""
      ) : (
        <>
          {props.jInfo?.isFree ? (
            ""
          ) : (
            <Typography
              style={{
                color: "#ff8400",
              }}
              gutterBottom
              className={"smtxt"}
            >
              {tr("JavaSelector.WarnNonFree")}
            </Typography>
          )}
          {props.jInfo?.vmSide === "Server" ? (
            ""
          ) : (
            <Typography
              style={{
                color: "#ff8400",
              }}
              className={"smtxt"}
              gutterBottom
            >
              {tr("JavaSelector.WarnClient")}
            </Typography>
          )}
          {props.jInfo?.bits === "64" ? (
            ""
          ) : (
            <Typography
              style={{
                color: "#ff8400",
              }}
              className={"smtxt"}
              gutterBottom
            >
              {tr("JavaSelector.Warn32")}
            </Typography>
          )}
        </>
      )}
    </>
  );
}

function JavaDownloader(): JSX.Element {
  const [isRunning, setRunning] = useState<boolean>(false);
  const mounted = useRef<boolean>(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return (
    <>
      <ShiftEle name={"JavaSelectorInstall"} bgfill>
        <Button
          variant={"contained"}
          color={"primary"}
          disabled={isRunning}
          onClick={() => {
            setRunning(true);
            void (async () => {
              if (os.platform() === "win32") {
                try {
                  await installJRE(false);
                } catch (e) {
                  submitError(String(e));
                } finally {
                  if (mounted.current) {
                    setRunning(false);
                  }
                }
              } else {
                void shell.openExternal(
                  "https://mirror.tuna.tsinghua.edu.cn/AdoptOpenJDK/16/jre/x64/linux/"
                );
                submitInfo(tr("JavaSelector.External"));
                setRunning(false);
              }
            })();
          }}
        >
          {tr("JavaSelector.GetNew")}
        </Button>
      </ShiftEle>
      <br />
      <ShiftEle name={"JavaSelectorInstall"} bgfill>
        <Button
          disabled={isRunning}
          variant={"contained"}
          color={"primary"}
          onClick={() => {
            setRunning(true);
            void (async () => {
              if (os.platform() === "win32") {
                try {
                  await installJRE(true);
                } catch (e) {
                  submitError(String(e));
                } finally {
                  if (mounted.current) {
                    setRunning(false);
                  }
                }
              } else {
                void shell.openExternal(
                  "https://mirror.tuna.tsinghua.edu.cn/AdoptOpenJDK/8/jre/x64/linux/"
                );
                submitInfo(tr("JavaSelector.External"));
                setRunning(false);
              }
            })();
          }}
          style={{
            marginTop: "1%",
          }}
        >
          {tr("JavaSelector.GetOld")}
        </Button>
      </ShiftEle>
    </>
  );
}

async function remoteSelectJava(): Promise<string> {
  return String((await ipcRenderer.invoke("selectJava")) || "");
}
