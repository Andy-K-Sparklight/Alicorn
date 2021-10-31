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
  FormControlLabel,
  IconButton,
  MuiThemeProvider,
  Radio,
  RadioGroup,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@material-ui/core";
import {
  Add,
  Eject,
  FolderOpen,
  Input,
  LayersClear,
  LinkOff,
} from "@material-ui/icons";
import { ipcRenderer, shell } from "electron";
import fs from "fs-extra";
import os from "os";
import path from "path";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { throttle } from "throttle-debounce";
import { abortableBasicHash, basicHash } from "../modules/commons/BasicHash";
import { isFileExist } from "../modules/commons/FileUtil";
import { scanCoresIn } from "../modules/container/ContainerScanner";
import {
  getAllContainerPaths,
  getAllContainers,
  getAllMounted,
  getAllNotMounted,
  getContainer,
  isMounted,
  mount,
  unmount,
} from "../modules/container/ContainerUtil";
import {
  clearContainer,
  createNewContainer,
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
import { submitSucc } from "./Message";
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
  let { modpack } = useParams<{ modpack?: string }>();
  modpack = modpack ? decodeURIComponent(modpack) : undefined;
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
      <OperatingHintCustom open={operating} msg={doing} />
      <FailedHint
        closeFunc={() => {
          setFailedOpen(false);
        }}
        open={failedOpen}
        reason={reason}
      />
      <AddNewContainer
        modpack={modpack}
        setOperate={(s) => {
          if (isEleMounted.current) {
            setOpen(s);
          }
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
          if (isEleMounted.current) {
            setCreating(false);
          }
        }}
      />
      <Box style={{ textAlign: "right", marginRight: "18%" }}>
        <Tooltip title={tr("ContainerManager.Add")}>
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
  const [isASC, setASCBit] = useState(false);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    mounted.current = true;
    if (props.isMounted) {
      void (async () => {
        if (await isSharedContainer(props.container)) {
          if (mounted.current) {
            setASCBit(true);
          }
        }
        const cores = (await scanCoresIn(props.container)).length;
        if (mounted.current) {
          setCount(cores);
        }
      })();
    }
    return () => {
      mounted.current = false;
    };
  }, [refresh]);
  return (
    <>
      <OperatingHint open={operating} />

      <Card className={props.isMounted ? classes.card : classes.uCard}>
        <CardContent>
          <>
            <Tooltip title={tr("ContainerManager.Remove")}>
              <IconButton
                color={"inherit"}
                className={classes.operateButton}
                onClick={() => {
                  setOpen(true);
                }}
              >
                <LinkOff />
              </IconButton>
            </Tooltip>
            <Tooltip title={tr("ContainerManager.Clear")}>
              <IconButton
                color={"inherit"}
                className={classes.operateButton}
                onClick={() => {
                  setClearOpen(true);
                }}
              >
                <LayersClear />
              </IconButton>
            </Tooltip>

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
            {props.isMounted ? (
              <Tooltip title={tr("ContainerManager.Unmount")}>
                <IconButton
                  color={"inherit"}
                  className={classes.operateButton}
                  onClick={() => {
                    unmount(props.container.id);
                    setContainerListDirty();
                  }}
                >
                  <Eject />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title={tr("ContainerManager.Mount")}>
                <IconButton
                  color={"inherit"}
                  className={classes.operateButton}
                  onClick={() => {
                    mount(props.container.id);
                    setContainerListDirty();
                    setRefresh(!refresh);
                  }}
                >
                  <Input />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={tr("ContainerManager.OpenInDir")}>
              <IconButton
                color={"inherit"}
                className={classes.operateButton}
                onClick={() => {
                  try {
                    shell.showItemInFolder(props.container.rootDir);
                  } catch {}
                }}
              >
                <FolderOpen />
              </IconButton>
            </Tooltip>
          </>
          <Typography variant={"h6"} gutterBottom>
            {props.container.id}
          </Typography>
          <Typography
            color={"textSecondary"}
            className={classes.text}
            gutterBottom
          >
            {tr("ContainerManager.RootDir") + " " + props.container.rootDir}
          </Typography>
          {props.isMounted ? (
            <Typography
              color={"textSecondary"}
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
  if (!(await isFileExist(n))) {
    return true;
  }
  return (await fs.stat(n)).isDirectory();
}

function genContainerName(s: string): string {
  const s2 = path.basename(s).split(".");
  s2.pop();
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
}): JSX.Element {
  const [selectedDir, setSelected] = useState(
    props.modpack
      ? !isURL(props.modpack)
        ? path.dirname(props.modpack)
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
  return (
    <MuiThemeProvider
      theme={
        isBgDark() ? ALICORN_DEFAULT_THEME_DARK : ALICORN_DEFAULT_THEME_LIGHT
      }
    >
      <Dialog
        open={props.open}
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
              style={{
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
              title={tr("ContainerManager.ASCCacheNotSet")}
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
              style={{
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
              style={{
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
              style={{
                display: allowModpack ? "inherit" : "none",
              }}
              variant={"outlined"}
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
            onClick={async () => {
              props.closeFunc();
              props.setOperate(true);
              addDoing(tr("ContainerManager.FetchingModpack"));
              let mp = await getTempStorePath(modpackPath);
              if (!(await isFileExist(modpackPath))) {
                if (
                  (await wrappedDownloadFile(
                    new DownloadMeta(modpackPath, mp)
                  )) !== 1
                ) {
                  props.setFailed(tr("ContainerManager.FailedToFetch"));
                }
              } else {
                mp = modpackPath;
              }
              try {
                await createContainer(usedName, selectedDir, createASC);
                if (mp.endsWith(".zip")) {
                  await wrappedInstallModpack(getContainer(usedName), mp);
                }
                if (mp.endsWith(".json")) {
                  await deployIJPack(getContainer(usedName), mp);
                }
                props.refresh();
              } catch (e) {
                props.setFailed(String(e));
              }

              setName("");
              setSelected("");
              setAllowModpack(false);
              setCreateASC(hasEdited("cx.shared-root"));
              setModpackPath("");
              props.setOperate(false);
              submitSucc(tr("ContainerManager.InstallOK"));
            }}
          >
            {tr("ContainerManager.Continue")}
          </Button>
        </DialogActions>
      </Dialog>
    </MuiThemeProvider>
  );
}

export async function remoteSelectDir(): Promise<string> {
  return String((await ipcRenderer.invoke("selectDir")) || "");
}

export async function remoteSelectModpack(): Promise<string> {
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
