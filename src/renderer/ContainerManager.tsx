import {
  Add,
  CopyAll,
  Eject,
  FolderOpen,
  Input,
  LayersClear,
  LinkOff,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fade,
  FormControlLabel,
  Grid,
  IconButton,
  Radio,
  RadioGroup,
  Switch,
  TextField,
  ThemeProvider,
  Tooltip,
  Typography,
} from "@mui/material";
import { ipcRenderer, shell } from "electron";
import fs from "fs-extra";
import os from "os";
import path from "path";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { throttle } from "throttle-debounce";
import { abortableBasicHash, basicHash } from "../modules/commons/BasicHash";
import { chkPermissions, isFileExist } from "../modules/commons/FileUtil";
import { scanCoresIn } from "../modules/container/ContainerScanner";
import {
  getAllContainerPaths,
  getAllContainers,
  getAllMounted,
  getAllNotMounted,
  getContainer,
  getDirSize,
  isMounted,
  mount,
  unmount,
} from "../modules/container/ContainerUtil";
import {
  clearContainer,
  createNewContainer,
  forkContainer,
  unlinkContainer,
} from "../modules/container/ContainerWrapper";
import { MinecraftContainer } from "../modules/container/MinecraftContainer";
import { isSharedContainer } from "../modules/container/SharedFiles";
import { DownloadMeta } from "../modules/download/AbstractDownloader";
import {
  addDoing,
  getDoing,
  subscribeDoing,
  unsubscribeDoing,
  wrappedDownloadFile,
} from "../modules/download/DownloadWrapper";
import { isWebFileExist } from "../modules/download/RainbowFetch";
import { deployIJPack } from "../modules/pff/modpack/InstallIJModpack";
import { wrappedInstallModpack } from "../modules/pff/modpack/InstallModpack";
import { setChangePageWarn } from "./GoTo";
import { Icons } from "./Icons";
import { submitSucc, submitWarn } from "./Message";
import {
  FailedHint,
  OperatingHint,
  OperatingHintCustom,
} from "./OperatingHint";
import { hasEdited } from "./Options";
import {
  ALICORN_DEFAULT_THEME_DARK,
  ALICORN_DEFAULT_THEME_LIGHT,
  isBgDark,
} from "./Renderer";
import { useCardStyles, useInputStyles, usePadStyles } from "./Stylex";
import { tr } from "./Translator";

export function setContainerListDirty(): void {
  window.dispatchEvent(new CustomEvent("setContainerListDirty"));
}

export function ContainerManager(): JSX.Element {
  // eslint-disable-next-line prefer-const
  let { modpack, togo } = useParams<{ modpack?: string; togo?: string }>();
  modpack = modpack ? decodeURIComponent(modpack) : undefined;
  const hasToGo = togo === "1";
  const isEleMounted = useRef<boolean>();
  const [refreshTrigger, triggerRefresh] = useState(true);
  const [operating, setOpen] = useState(false);
  const classes2 = usePadStyles();
  const [doing, setDoing] = useState(getDoing());
  const [failedOpen, setFailedOpen] = useState(false);
  const [reason, setReason] = useState("Untracked Error");
  const [opening, setCreating] = useState(!!modpack);
  useEffect(() => {
    isEleMounted.current = true;
    const fun = () => {
      if (isEleMounted.current) {
        triggerRefresh(!refreshTrigger);
      }
    };
    window.addEventListener("setContainerListDirty", fun);
    return () => {
      window.removeEventListener("setContainerListDirty", fun);
      isEleMounted.current = false;
    };
  });
  useEffect(() => {
    subscribeDoing(
      "ContainerManager",
      throttle(250, (d) => {
        setDoing(d);
      })
    );
    return () => {
      unsubscribeDoing("ContainerManager");
    };
  }, []);
  const allContainers = getAllMounted().concat(getAllNotMounted());
  return (
    <Box className={classes2.para}>
      <ThemeProvider
        theme={
          isBgDark() ? ALICORN_DEFAULT_THEME_DARK : ALICORN_DEFAULT_THEME_LIGHT
        }
      >
        <OperatingHintCustom open={operating} msg={doing} />
        <FailedHint
          closeFunc={() => {
            setFailedOpen(false);
          }}
          open={failedOpen}
          reason={reason}
        />
      </ThemeProvider>
      <AddNewContainer
        autoStart={hasToGo}
        modpack={modpack}
        setOperate={(s) => {
          setOpen(s);
        }}
        refresh={() => {
          triggerRefresh(!refreshTrigger);
        }}
        open={opening}
        setFailed={(e) => {
          setFailedOpen(true);
          setReason(e);
        }}
        closeFunc={() => {
          setCreating(false);
        }}
      />
      <Box sx={{ textAlign: "right" }}>
        <Tooltip
          title={
            <Typography className={"smtxt"}>
              {tr("ContainerManager.Add")}
            </Typography>
          }
        >
          <IconButton
            color={"inherit"}
            onClick={() => {
              if (isEleMounted.current) {
                setCreating(true);
              }
            }}
          >
            <Add />
          </IconButton>
        </Tooltip>
      </Box>
      {allContainers.map((c) => {
        const im = isMounted(c);
        return (
          <SingleContainerDisplay
            key={c}
            container={getContainer(c)}
            isMounted={im}
          />
        );
      })}
    </Box>
  );
}

function SingleContainerDisplay(props: {
  container: MinecraftContainer;
  isMounted: boolean;
}): JSX.Element {
  const classes = useCardStyles();
  const mounted = useRef<boolean>(false);
  const [deleteAskOpen, setOpen] = useState(false);
  const [clearAskOpen, setClearOpen] = useState(false);
  const [operating, setOperating] = useState(false);
  const [coreCount, setCount] = useState(-1);
  const [isASC, setASCBit] = useState<boolean | null>(null);
  const [refresh, setRefresh] = useState(false);
  const [size, setSize] = useState(-1);
  const [fullSize, setFullSize] = useState(-1);
  const [showBtn, setShowBtn] = useState(false);
  useEffect(() => {
    mounted.current = true;
    if (props.isMounted) {
      void (async () => {
        if (await isSharedContainer(props.container)) {
          if (mounted.current) {
            setASCBit(true);
          }
        } else {
          if (mounted.current) {
            setASCBit(false);
          }
        }
        const cores = (await scanCoresIn(props.container)).length;
        if (mounted.current) {
          setCount(cores);
        }
      })();
    } else {
      setASCBit(null);
    }
    return () => {
      mounted.current = false;
    };
  }, [refresh]);
  useEffect(() => {
    if (props.isMounted) {
      void getDirSize(props.container.rootDir).then((r) => {
        if (mounted.current) {
          setSize(r);
        }
      });
    }
  }, [props.isMounted]);
  useEffect(() => {
    if (isASC && props.isMounted) {
      void getDirSize(props.container.rootDir, true).then((r) => {
        if (mounted.current) {
          setFullSize(r);
        }
      });
    }
  }, [isASC]);
  return (
    <>
      <OperatingHint open={operating} />
      <Card
        sx={{
          backgroundColor: props.isMounted ? "primary.main" : "primary.light",
        }}
        raised={true}
        color={"primary"}
        className={props.isMounted ? classes.card : classes.uCard}
        onMouseOver={() => {
          setShowBtn(true);
        }}
        onMouseLeave={() => {
          setShowBtn(false);
        }}
        onClick={() => {
          if (props.isMounted) {
            unmount(props.container.id);
            setContainerListDirty();
            setRefresh(!refresh);
          } else {
            mount(props.container.id);
            setContainerListDirty();
            setRefresh(!refresh);
          }
        }}
      >
        <CardContent>
          <Box sx={{ float: "right" }}>
            <Fade in={showBtn}>
              <Grid container direction={"row"}>
                <Grid container direction={"column"} sx={{ width: "auto" }}>
                  <Grid container direction={"row"}>
                    <Tooltip
                      title={
                        <Typography className={"smtxt"}>
                          {tr("ContainerManager.Remove")}
                        </Typography>
                      }
                    >
                      <IconButton
                        color={"inherit"}
                        className={classes.operateButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpen(true);
                        }}
                      >
                        <LinkOff />
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title={
                        <Typography className={"smtxt"}>
                          {tr("ContainerManager.Fork")}
                        </Typography>
                      }
                    >
                      <IconButton
                        color={"inherit"}
                        className={classes.operateButton}
                        onClick={async (e) => {
                          e.stopPropagation();
                          setOperating(true);
                          setChangePageWarn(true);
                          try {
                            await forkContainer(props.container);
                            submitSucc(tr("ContainerManager.Forked"));
                          } catch (e) {
                            submitWarn(tr("ContainerManager.FailedToFork"));
                          }
                          setChangePageWarn(false);
                          setOperating(false);
                          setContainerListDirty();
                          setRefresh(!refresh);
                        }}
                      >
                        <CopyAll />
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title={
                        <Typography className={"smtxt"}>
                          {tr("ContainerManager.Clear")}
                        </Typography>
                      }
                    >
                      <IconButton
                        color={"inherit"}
                        className={classes.operateButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setClearOpen(true);
                        }}
                      >
                        <LayersClear />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                  <Grid container direction={"row"}>
                    {props.isMounted ? (
                      <Tooltip
                        title={
                          <Typography className={"smtxt"}>
                            {tr("ContainerManager.Unmount")}
                          </Typography>
                        }
                      >
                        <IconButton
                          color={"inherit"}
                          className={classes.operateButton}
                          // This has the same effect with just click the card
                        >
                          <Eject />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip
                        title={
                          <Typography className={"smtxt"}>
                            {tr("ContainerManager.Mount")}
                          </Typography>
                        }
                      >
                        <IconButton
                          color={"inherit"}
                          className={classes.operateButton}
                        >
                          <Input />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip
                      title={
                        <Typography className={"smtxt"}>
                          {tr("ContainerManager.OpenInDir")}
                        </Typography>
                      }
                    >
                      <IconButton
                        color={"inherit"}
                        className={classes.operateButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          try {
                            shell.showItemInFolder(props.container.rootDir);
                          } catch {}
                        }}
                      >
                        <FolderOpen />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                </Grid>
                <Grid item>
                  {!props.isMounted || isASC === null ? (
                    ""
                  ) : (
                    <img
                      src={isASC ? Icons.CONTAINER_ASC : Icons.CONTAINER_MCX}
                      width={80}
                    />
                  )}
                </Grid>
              </Grid>
            </Fade>
          </Box>

          <ThemeProvider
            theme={
              isBgDark()
                ? ALICORN_DEFAULT_THEME_DARK
                : ALICORN_DEFAULT_THEME_LIGHT
            }
          >
            <Dialog
              open={deleteAskOpen}
              onClose={() => {
                setOpen(false);
              }}
            >
              <DialogTitle>{tr("ContainerManager.AskRemove")}</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  {tr(
                    "ContainerManager.AskRemoveDetail",
                    `ID=${props.container}`
                  )}
                </DialogContentText>
                <DialogActions>
                  <Button
                    onClick={() => {
                      setOpen(false);
                      unlinkContainer(props.container.id);
                      setContainerListDirty();
                    }}
                  >
                    {tr("ContainerManager.Yes")}
                  </Button>
                  <Button
                    onClick={() => {
                      setOpen(false);
                    }}
                  >
                    {tr("ContainerManager.No")}
                  </Button>
                </DialogActions>
              </DialogContent>
            </Dialog>
            <Dialog
              open={clearAskOpen}
              onClose={() => {
                setClearOpen(false);
              }}
            >
              <DialogTitle>{tr("ContainerManager.AskClear")}</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  {tr(
                    "ContainerManager.AskClearDetail",
                    `ID=${props.container.id}`
                  )}
                </DialogContentText>
                <DialogActions>
                  <Button
                    onClick={async () => {
                      setClearOpen(false);
                      setOperating(true);
                      await clearContainer(props.container.id);
                      unlinkContainer(props.container.id);
                      setContainerListDirty();
                      if (mounted.current) {
                        setOperating(false);
                      }
                    }}
                  >
                    {tr("ContainerManager.Yes")}
                  </Button>
                  <Button
                    onClick={() => {
                      setClearOpen(false);
                    }}
                  >
                    {tr("ContainerManager.No")}
                  </Button>
                </DialogActions>
              </DialogContent>
            </Dialog>
          </ThemeProvider>
          <Typography
            variant={"h6"}
            sx={{ color: isBgDark() ? "secondary.light" : undefined }}
            gutterBottom
          >
            {props.container.id}
          </Typography>
          <Typography
            sx={{ color: isBgDark() ? "secondary.light" : undefined }}
            className={classes.text}
            gutterBottom
          >
            {tr("ContainerManager.RootDir") + " " + props.container.rootDir}
          </Typography>
          {props.isMounted ? (
            <>
              <Typography
                sx={{ color: isBgDark() ? "secondary.light" : undefined }}
                className={classes.text}
                gutterBottom
              >
                {(coreCount >= 0
                  ? tr("ContainerManager.Cores", `Count=${coreCount}`)
                  : tr("ContainerManager.CoresLoading")) +
                  " - " +
                  tr(
                    isASC
                      ? "ContainerManager.Type.Shared"
                      : "ContainerManager.Type.Physical"
                  )}
              </Typography>
              <Typography
                sx={{ color: isBgDark() ? "secondary.light" : undefined }}
                className={classes.text}
                gutterBottom
              >
                {(() => {
                  let opac = "";
                  if (size > 0) {
                    opac += tr(
                      "ContainerManager.Size",
                      `Size=${Math.round(size / 1048576)}`
                    );
                    if (isASC && fullSize > size) {
                      opac +=
                        " - " +
                        tr(
                          "ContainerManager.DiscountASC",
                          `Rate=${
                            Math.round(((fullSize - size) * 1000) / fullSize) /
                            10
                          }`
                        );
                    }
                    return opac;
                  } else {
                    return tr("ContainerManager.Calculating");
                  }
                })()}
              </Typography>
            </>
          ) : (
            ""
          )}
        </CardContent>
      </Card>
      <br />
    </>
  );
}

function validateName(n: string): boolean {
  n = n.trim();
  if (n.length <= 0) {
    return true;
  }
  return !getAllContainers().includes(n);
}

async function validateDir(n: string): Promise<boolean> {
  n = n.trim();
  if (n.length <= 0) {
    return true;
  }
  n = path.resolve(n);
  if (getAllContainerPaths().includes(n)) {
    return false;
  }
  if (!(await chkPermissions(n))) {
    return false;
  }
  if (!(await isFileExist(n))) {
    return true;
  }
  return (await fs.stat(n)).isDirectory();
}

function genContainerName(s: string): string {
  const s2 = path.basename(s).split(".");
  if (s2.length >= 2) {
    s2.pop();
  }
  const s3 = s2.join(".").replace(/^\S/, (s) => s.toUpperCase());
  return s3 || "Container" + Math.floor(Math.random() * 10000);
}

function isURL(u: string): boolean {
  try {
    new URL(u);
    return true;
  } catch {
    return false;
  }
}

function AddNewContainer(props: {
  open: boolean;
  closeFunc: () => unknown;
  setOperate: (s: boolean) => unknown;
  setFailed: (s: string) => unknown;
  refresh: () => unknown;
  modpack?: string;
  autoStart?: boolean;
}): JSX.Element {
  const [selectedDir, setSelected] = useState(
    props.modpack
      ? !isURL(props.modpack)
        ? path.join(
            path.dirname(props.modpack),
            "Modpack-" + basicHash(props.modpack).slice(0, 6)
          )
        : path.join(
            os.homedir(),
            "OnlineModpack-" + basicHash(props.modpack).slice(0, 6)
          )
      : ""
  );
  const [usedName, setName] = useState(
    props.modpack ? genContainerName(props.modpack) : ""
  );
  const [nameError, setNameError] = useState(false);
  const [dirError, setDirError] = useState(false);
  const [modpackError, setModpackError] = useState(false);
  const [createASC, setCreateASC] = useState(hasEdited("cx.shared-root"));
  const [allowModpack, setAllowModpack] = useState(!!props.modpack);
  const [modpackPath, setModpackPath] = useState(props.modpack || "");
  const classes = useInputStyles();
  useEffect(() => {
    if (props.autoStart) {
      props.closeFunc();
      void start(props);
    }
  }, []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const start = async (props: any) => {
    props.closeFunc();
    props.setOperate(true);
    try {
      await createContainer(usedName, selectedDir, createASC);
    } catch (e) {
      props.setFailed(String(e));
    }
    if (allowModpack) {
      addDoing(tr("ContainerManager.FetchingModpack"));
      let mp = await getTempStorePath(modpackPath);
      if (!(await isFileExist(modpackPath))) {
        if (
          (await wrappedDownloadFile(new DownloadMeta(modpackPath, mp))) !== 1
        ) {
          props.setFailed(tr("ContainerManager.FailedToFetch"));
        }
      } else {
        mp = modpackPath;
      }

      try {
        const s = await fs.stat(mp);
        if (mp.endsWith(".zip") || s.isDirectory()) {
          await wrappedInstallModpack(getContainer(usedName), mp);
        }
        if (mp.endsWith(".json")) {
          await deployIJPack(getContainer(usedName), mp);
        }
        props.refresh();
      } catch (e) {
        props.setFailed(String(e));
      }
    }
    setName("");
    setSelected("");
    setAllowModpack(false);
    setCreateASC(hasEdited("cx.shared-root"));
    setModpackPath("");
    props.setOperate(false);
    props.refresh();
    submitSucc(tr("ContainerManager.InstallOK"));
  };
  return (
    <ThemeProvider
      theme={
        isBgDark() ? ALICORN_DEFAULT_THEME_DARK : ALICORN_DEFAULT_THEME_LIGHT
      }
    >
      <Dialog
        open={props.open && !props.autoStart}
        onClose={() => {
          setName("");
          setSelected("");
        }}
      >
        <DialogTitle>{tr("ContainerManager.Add")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {tr("ContainerManager.AddDescription")}
          </DialogContentText>
          <TextField
            error={nameError}
            autoFocus
            className={classes.input}
            margin={"dense"}
            color={"secondary"}
            onChange={(e) => {
              const v = e.target.value;
              setNameError(!validateName(v));
              setName(v);
            }}
            label={
              nameError
                ? tr("ContainerManager.InvalidName")
                : tr("ContainerManager.EnterName")
            }
            type={"text"}
            spellCheck={false}
            fullWidth
            variant={"outlined"}
            value={usedName}
          />
          {/* Choose Dir */}
          <>
            <TextField
              error={dirError}
              className={classes.input}
              color={"secondary"}
              margin={"dense"}
              onChange={(e) => {
                setSelected(e.target.value);
                void validateDir(e.target.value).then((b) => {
                  setDirError(!b);
                });
              }}
              label={
                dirError
                  ? tr("ContainerManager.InvalidDir")
                  : tr("ContainerManager.Dir")
              }
              type={"text"}
              spellCheck={false}
              fullWidth
              variant={"outlined"}
              value={selectedDir}
            />

            <Button
              className={classes.inputDark}
              type={"button"}
              sx={{
                display: "inline",
              }}
              variant={"outlined"}
              onClick={async () => {
                const d = await remoteSelectDir();
                if (d.length === 0) {
                  return;
                }
                setSelected(d);
                void validateDir(d).then((b) => {
                  setDirError(!b);
                });
              }}
            >
              {tr("ContainerManager.Select")}
            </Button>
          </>
          <RadioGroup
            row
            onChange={(e) => {
              switch (e.target.value) {
                case "Physical":
                  setCreateASC(false);
                  break;
                case "Shared":
                  setCreateASC(true);
              }
            }}
          >
            <FormControlLabel
              value={"Physical"}
              control={<Radio checked={!createASC} />}
              label={tr("ContainerManager.Type.Physical")}
            />
            <Tooltip
              title={
                <Typography className={"smtxt"}>
                  {tr("ContainerManager.ASCCacheNotSet")}
                </Typography>
              }
              disableHoverListener={hasEdited("cx.shared-root")}
              disableFocusListener={hasEdited("cx.shared-root")}
              disableTouchListener={hasEdited("cx.shared-root")}
            >
              <FormControlLabel
                value={"Shared"}
                control={
                  hasEdited("cx.shared-root") ? (
                    <Radio checked={createASC} />
                  ) : (
                    <Radio disabled checked={false} />
                  )
                }
                label={tr("ContainerManager.Type.Shared")}
              />
            </Tooltip>
          </RadioGroup>
          <FormControlLabel
            control={
              <Switch
                checked={allowModpack}
                onChange={(e) => {
                  setAllowModpack(e.target.checked);
                }}
              />
            }
            label={tr("ContainerManager.CreateModpack")}
          />
          {/* Choose Modpack */}
          <>
            <DialogContentText
              sx={{
                display: allowModpack ? "inherit" : "none",
              }}
            >
              {tr("ContainerManager.ModpackWarn")}
            </DialogContentText>
            <TextField
              error={modpackError}
              className={classes.input}
              color={"secondary"}
              autoFocus
              sx={{
                display: allowModpack ? "inherit" : "none",
              }}
              margin={"dense"}
              onChange={(e) => {
                setModpackPath(e.target.value);
                void isFileExist(e.target.value).then((b) => {
                  if (b) {
                    void isWebFileExist(e.target.value)
                      .then((b) => {
                        setModpackError(!b);
                      })
                      .catch(() => {
                        setModpackError(true);
                      });
                  }
                  setModpackError(!b);
                });
              }}
              label={
                modpackError
                  ? tr("ContainerManager.InvalidModpackPath")
                  : tr("ContainerManager.ModpackPath")
              }
              type={"text"}
              spellCheck={false}
              fullWidth
              variant={"outlined"}
              value={modpackPath}
            />

            <Button
              className={classes.inputDark}
              type={"button"}
              sx={{
                display: allowModpack ? "inherit" : "none",
              }}
              variant={"contained"}
              onClick={async () => {
                const d = await remoteSelectModpack();
                setModpackPath(d);
                void isFileExist(d).then((b) => {
                  setModpackError(!b);
                });
              }}
            >
              {tr("ContainerManager.ChooseModpack")}
            </Button>
          </>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              props.closeFunc();
              setName("");
              setSelected("");
              setAllowModpack(false);
              setCreateASC(hasEdited("cx.shared-root"));
              setModpackPath("");
              setDirError(false);
              setModpackError(false);
            }}
          >
            {tr("ContainerManager.Cancel")}
          </Button>
          <Button
            disabled={
              nameError ||
              dirError ||
              modpackError ||
              usedName.trim().length <= 0 ||
              selectedDir.trim().length <= 0 ||
              (allowModpack && modpackPath.trim().length <= 0)
            }
            onClick={() => {
              void start(props);
            }}
          >
            {tr("ContainerManager.Continue")}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export async function remoteSelectDir(): Promise<string> {
  return String((await ipcRenderer.invoke("selectDir")) || "");
}

async function remoteSelectModpack(): Promise<string> {
  return String((await ipcRenderer.invoke("selectModpack")) || "");
}

async function createContainer(
  id: string,
  dir: string,
  asc = false
): Promise<void> {
  await createNewContainer(dir, id, asc);
}
async function getTempStorePath(u: string): Promise<string> {
  return path.join(
    os.tmpdir(),
    "alicorn-modpacks",
    (await abortableBasicHash(u)) + (u.endsWith(".json") ? ".json" : ".zip")
  );
}
