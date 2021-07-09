import React, { useEffect, useRef, useState } from "react";
import { fullWidth, useFormStyles } from "./Stylex";
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
import { whereJava } from "../modules/java/WhereJava";
import {
  getAllJava,
  getJavaInfoRaw,
  getLastUsedJavaHome,
  JavaInfo,
  parseJavaInfo,
  parseJavaInfoRaw,
  resetJavaList,
  setLastUsedJavaHome,
} from "../modules/java/JInfo";
import { tr } from "./Translator";
import objectHash from "object-hash";
import { Refresh } from "@material-ui/icons";
import { ALICORN_DEFAULT_THEME_LIGHT, submitError } from "./Renderer";
import { installJRE } from "../modules/java/GetJDK";
import os from "os";
import { ipcRenderer } from "electron";
import path from "path";

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
  const [currentJava, setCurrentJava] = useState<string>(getLastUsedJavaHome());
  const [currentJavaInfo, setCurrentJavaInfo] =
    useState<JavaInfo>(CANNOT_LOAD_INFO);
  const display = useRef<boolean>(os.platform() === "win32");
  const [refreshBit, setRefreshBit] = useState<boolean>(false);
  useEffect(() => {
    mounted.current = true;

    (async () => {
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
    (async () => {
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
        }
        setLoaded(true);
      }
    })();
  }, [isJavaInfoLoaded, refreshBit]);
  return (
    <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
      <Box className={classes.root}>
        <Typography
          variant={"h5"}
          color={"primary"}
          className={classes.title}
          gutterBottom
        >
          {tr("JavaSelector.SelectJavaTitle")}
        </Typography>

        <FormControl>
          <InputLabel id={"Select-JRE"} className={classes.label}>
            {tr("JavaSelector.SelectJava")}
          </InputLabel>
          <Select
            disabled={!isJavaInfoLoaded}
            labelId={"Select-JRE"}
            color={"primary"}
            className={classes.selector + " " + fullWidthClasses.form}
            onChange={(e) => {
              const sj = String(e.target.value);
              setCurrentJava(sj);
              setLastUsedJavaHome(sj);
            }}
            value={currentJava}
          >
            {javaList.map((j) => {
              return (
                <MenuItem key={objectHash(j)} value={j}>
                  {j}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
        <Tooltip title={tr("JavaSelector.Reload")}>
          <IconButton
            color={"primary"}
            className={fullWidthClasses.right}
            onClick={() => {
              setLoaded(false);
            }}
          >
            <Refresh />
          </IconButton>
        </Tooltip>
        <br />
        <br />
        <Button
          variant={"outlined"}
          color={"primary"}
          onClick={() => {
            (async () => {
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
        <br />
        <br />
        {isJavaInfoLoaded ? (
          ""
        ) : (
          <Box>
            <LinearProgress color={"secondary"} />
            <br />
            <Typography className={classes.text} color={"primary"} gutterBottom>
              {tr("JavaSelector.Loading")}
            </Typography>
          </Box>
        )}

        <JavaInfoDisplay
          jInfo={isJavaInfoLoaded ? javaInfo.get(currentJava) : currentJavaInfo}
        />
        {display.current ? <JavaDownloader /> : ""}
      </Box>
    </MuiThemeProvider>
  );
}

function JavaInfoDisplay(props: { jInfo?: JavaInfo }): JSX.Element {
  const corruptBit =
    props.jInfo?.rootVersion === -1 || props.jInfo === undefined;
  return (
    <Box>
      <Typography variant={"h6"} color={"primary"} gutterBottom>
        {corruptBit
          ? tr("JavaSelector.CannotLoad")
          : `Java ${props.jInfo?.rootVersion || 0}`}
      </Typography>
      {corruptBit ? (
        ""
      ) : (
        <Box>
          <Typography color={"secondary"} gutterBottom>
            {props.jInfo?.runtime || "Unknown"}
          </Typography>
          <Typography color={"secondary"} gutterBottom>
            {props.jInfo?.vm || "Unknown"}
          </Typography>
        </Box>
      )}
      {corruptBit ? (
        <Typography
          style={{ fontSize: "small", color: "#ff8400" }}
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
        <Box>
          {props.jInfo?.isFree ? (
            ""
          ) : (
            <Typography
              style={{ fontSize: "small", color: "#ff8400" }}
              gutterBottom
            >
              {tr("JavaSelector.WarnNonFree")}
            </Typography>
          )}
          {props.jInfo?.vmSide === "Server" ? (
            ""
          ) : (
            <Typography
              style={{ fontSize: "small", color: "#ff8400" }}
              gutterBottom
            >
              {tr("JavaSelector.WarnClient")}
            </Typography>
          )}
          {props.jInfo?.bits === "64" ? (
            ""
          ) : (
            <Typography
              style={{ fontSize: "small", color: "#ff8400" }}
              gutterBottom
            >
              {tr("JavaSelector.Warn32")}
            </Typography>
          )}
        </Box>
      )}
    </Box>
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
    <Box>
      <Button
        variant={"outlined"}
        color={"primary"}
        disabled={isRunning}
        onClick={() => {
          setRunning(true);
          (async () => {
            try {
              await installJRE(false);
            } catch (e) {
              submitError(e);
            } finally {
              if (mounted.current) {
                setRunning(false);
              }
            }
          })();
        }}
      >
        {tr("JavaSelector.GetNew")}
      </Button>
      <br />
      <Button
        disabled={isRunning}
        variant={"outlined"}
        color={"primary"}
        onClick={() => {
          setRunning(true);
          (async () => {
            try {
              await installJRE(true);
            } catch (e) {
              submitError(e);
            } finally {
              if (mounted.current) {
                setRunning(false);
              }
            }
          })();
        }}
        style={{
          marginTop: "1%",
        }}
      >
        {tr("JavaSelector.GetOld")}
      </Button>
    </Box>
  );
}

async function remoteSelectJava(): Promise<string> {
  return String((await ipcRenderer.invoke("selectJava")) || "");
}
