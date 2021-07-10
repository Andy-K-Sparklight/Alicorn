import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  FormControl,
  IconButton,
  InputAdornment,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MuiThemeProvider,
  TextField,
  Typography,
} from "@material-ui/core";
import { ALICORN_DEFAULT_THEME_LIGHT } from "./Renderer";
import {
  ArrowForward,
  AssignmentLate,
  AssignmentTurnedIn,
} from "@material-ui/icons";
import EventEmitter from "events";
import { tr } from "./Translator";
import { useParams } from "react-router";
import { PFF_MSG_GATE } from "../modules/pff/curseforge/Values";
import { getContainer } from "../modules/container/ContainerUtil";
import { fullWidth } from "./Stylex";
import { loadLockFile, Lockfile } from "../modules/pff/curseforge/Lockfile";
import { MinecraftContainer } from "../modules/container/MinecraftContainer";
import { requireMod, setPffFlag } from "../modules/pff/curseforge/Wrapper";
import { getString } from "../modules/config/ConfigSupport";
import tunnel from "global-tunnel-ng";
import { setChangePageWarn } from "./GoTo";

export function PffFront(): JSX.Element {
  const emitter = useRef(new EventEmitter());
  const { container, version } =
    useParams<{ container: string; version: string }>();
  const [isRunning, setRunning] = useState(false);
  const [info, setInfo] = useState("");
  const [packageName, setPackageName] = useState("");
  const [lockfile, setLockfile] = useState<Lockfile>();
  const mounted = useRef(false);
  const reloadPff = useRef(false);
  const fullWidthClasses = fullWidth();
  useEffect(() => {
    (async () => {
      const lock = await loadLockFile(getContainer(container));
      if (mounted.current) {
        setLockfile(lock);
      }
    })();
  }, [isRunning, reloadPff.current]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const fun = (msg: string) => {
      if (mounted.current) {
        setInfo(msg);
      }
    };
    emitter.current.on(PFF_MSG_GATE, fun);
    return () => {
      emitter.current.removeListener(PFF_MSG_GATE, fun);
    };
  }, []);
  return (
    <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
      <Box className={fullWidthClasses.root}>
        <FormControl>
          <TextField
            spellCheck={false}
            className={fullWidthClasses.form}
            color={"primary"}
            value={packageName}
            disabled={isRunning}
            placeholder={tr("PffFront.Slug")}
            onChange={(e) => {
              setPackageName(e.target.value);
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position={"end"}>
                  <IconButton
                    disabled={isRunning || packageName.trim().length === 0}
                    color={"primary"}
                    onClick={() => {
                      setRunning(true);
                      (async () => {
                        await pffInstall(
                          packageName,
                          getContainer(container),
                          version,
                          emitter.current
                        );
                        if (mounted.current) {
                          setRunning(false);
                        }
                      })();
                    }}
                  >
                    <ArrowForward />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </FormControl>
        {isRunning ? (
          <LinearProgress
            color={"secondary"}
            style={{ width: "80%" }}
            className={fullWidthClasses.progress}
          />
        ) : (
          ""
        )}
        <Typography
          style={{
            textAlign: "center",
            fontSize: "small",
          }}
          color={"primary"}
        >
          {info}
        </Typography>
      </Box>
      <Box>
        <Typography className={fullWidthClasses.text} color={"primary"}>
          {tr("PffFront.QuickWatch")}
        </Typography>
        <List>
          {lockfile
            ? Object.keys(lockfile.files).map((name) => {
                const f = lockfile.files[name];
                return (
                  <ListItem key={name}>
                    <ListItemIcon>
                      {version === f.gameVersion ? (
                        <AssignmentTurnedIn color={"primary"} />
                      ) : (
                        <AssignmentLate />
                      )}
                    </ListItemIcon>
                    <ListItemText>
                      <Typography
                        style={Object.assign(
                          {
                            fontSize: "small",
                          },
                          version === f.gameVersion ? {} : { color: "gray" }
                        )}
                        color={"secondary"}
                      >{`${f.addonName} [${f.addonId}] / ${f.fileName} [${
                        f.fileId
                      }] # ${new Date(
                        f.fileDate
                      ).toLocaleString()}`}</Typography>
                    </ListItemText>
                  </ListItem>
                );
              })
            : []}
        </List>
      </Box>
    </MuiThemeProvider>
  );
}

async function pffInstall(
  name: string,
  container: MinecraftContainer,
  version: string,
  emitter: EventEmitter
): Promise<void> {
  setChangePageWarn(true);
  let i: string | number = name;
  const p = parseInt(name);
  if (String(p) == name) {
    i = p;
  }
  setPffFlag("1");
  const url = getString("pff.proxy", "");
  if (url) {
    try {
      const p = new URL(url);
      tunnel.initialize({
        host: p.hostname,
        port: parseInt(p.port),
      });
    } catch {}
  }
  await requireMod(i, version, container, emitter);
  if (url) {
    tunnel.end();
  }
  setPffFlag("0");
  setChangePageWarn(false);
}
