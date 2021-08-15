import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  makeStyles,
  MenuItem,
  MuiThemeProvider,
  Select,
  TextField,
  Tooltip,
  Typography,
} from "@material-ui/core";
import {
  Add,
  Delete,
  ExpandMore,
  FlightTakeoff,
  SignalCellular4Bar,
  SignalCellularAlt,
  SignalCellularConnectedNoInternet0Bar,
} from "@material-ui/icons";
import { ipcRenderer } from "electron";
import React, { useEffect, useRef, useState } from "react";
import { scanCoresInAllMountedContainers } from "../modules/container/ContainerScanner";
import {
  addServer,
  getServerList,
  removeServer,
  trimServerAddress,
} from "../modules/server/ServerFiles";
import { jumpTo, Pages, triggerSetPage } from "./GoTo";
import { ALICORN_DEFAULT_THEME_LIGHT } from "./Renderer";
import { fullWidth, useFormStyles, useInputStyles } from "./Stylex";
import { tr } from "./Translator";
export function ServerList(): JSX.Element {
  const [servers, setServers] = useState(getServerList());
  const [serverAddOpen, setServerAddOpen] = useState(false);
  const [cores, setCores] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const ss = await scanCoresInAllMountedContainers(false);
      const j: string[] = [];
      for (const [c, cs] of ss) {
        cs.forEach((cx) => {
          j.push(c.id + "/" + cx);
        });
      }
      setCores(j);
    })();
  }, []);
  return (
    <Box>
      <Box style={{ textAlign: "right", marginRight: "18%" }}>
        <Tooltip title={tr("ServerList.Add")}>
          <IconButton
            color={"primary"}
            onClick={() => {
              setServerAddOpen(true);
            }}
          >
            <Add />
          </IconButton>
        </Tooltip>
      </Box>
      {servers.map((s) => {
        if (s.trim().length > 0) {
          return <SingleServerDisplay key={s} address={s} cores={cores} />;
        } else {
          return "";
        }
      })}
      <AddNewServer
        open={serverAddOpen}
        onClose={() => {
          setServerAddOpen(false);
        }}
        onNewServer={(s) => {
          const sx = servers.concat();
          sx.unshift(s);
          setServers(sx);
          addServer(s);
        }}
        servers={servers}
      />
    </Box>
  );
}

const useAccStyles = makeStyles((theme) =>
  createStyles({
    root: {},
    acc1: {
      backgroundColor: theme.palette.primary.main,
    },
    acc2: {
      backgroundColor: theme.palette.primary.dark,
    },
    table: {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.primary.main,
    },
    btn: {
      color: theme.palette.primary.light,
      borderColor: theme.palette.primary.light,
    },
  })
);

function AddNewServer(props: {
  open: boolean;
  onClose: () => unknown;
  onNewServer: (s: string) => unknown;
  servers: string[];
}): JSX.Element {
  const [enteredServer, setEnteredServer] = useState("");
  const classes = useInputStyles();
  return (
    <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
      <Dialog open={props.open}>
        <DialogTitle>{tr("ServerList.AddNewServer.Title")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {tr("ServerList.AddNewServer.Description")}
          </DialogContentText>
          <DialogContentText>
            <span
              style={{
                fontSize:
                  window.sessionStorage.getItem("smallFontSize") || "16px",
                color: "red",
              }}
            >
              {tr("ServerList.AddNewServer.SincereWarn")}
            </span>
          </DialogContentText>
          <TextField
            error={props.servers.includes(enteredServer)}
            autoFocus
            className={classes.inputDark}
            margin={"dense"}
            color={"primary"}
            onChange={(e) => {
              setEnteredServer(e.target.value);
            }}
            type={"text"}
            spellCheck={false}
            fullWidth
            variant={"outlined"}
            label={tr("ServerList.AddNewServer.Address")}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              props.onClose();
              setEnteredServer("");
            }}
          >
            {tr("ServerList.AddNewServer.Cancel")}
          </Button>
          <Button
            disabled={
              props.servers.includes(enteredServer) ||
              enteredServer.trim().length === 0
            }
            onClick={() => {
              props.onClose();
              props.onNewServer(trimServerAddress(enteredServer));
              setEnteredServer("");
            }}
          >
            {tr("ServerList.AddNewServer.OK")}
          </Button>
        </DialogActions>
      </Dialog>
    </MuiThemeProvider>
  );
}

export function SingleServerDisplay(props: {
  address: string;
  cores: string[];
}): JSX.Element {
  const [connective, setCanConnect] = useState<boolean | undefined>(undefined);
  const [isDeleted, setDeleted] = useState(false);
  const reachableLock = useRef<boolean>(false);
  useEffect(() => {
    if (!reachableLock.current) {
      reachableLock.current = true;
      (async () => {
        const s = !!(await ipcRenderer.invoke("isReachable", props.address));
        setCanConnect(s);
      })();
    }
  });
  const classes = useAccStyles();
  return (
    <Accordion
      className={classes.acc1}
      style={isDeleted ? { display: "none" } : {}}
    >
      <AccordionSummary
        className={classes.acc1}
        expandIcon={<ExpandMore />}
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <Typography
          style={{
            display: "inline",
            lineHeight: "3",
          }}
        >
          {props.address}
        </Typography>
        <Box
          style={{
            display: "inline",
            marginLeft: "auto",
          }}
        >
          <Tooltip title={tr("ServerList.Remove")}>
            <IconButton
              style={{
                marginRight: 0,
              }}
              onClick={() => {
                setDeleted(true);
                removeServer(props.address);
              }}
            >
              <Delete />
            </IconButton>
          </Tooltip>
          <Tooltip title={tr("ServerList.Launch")}>
            <IconButton
              style={{
                marginRight: 0,
              }}
              onClick={() => {
                jumpTo(
                  `/ReadyToLaunch/${getLastUsedCore(props.address)}/${
                    props.address
                  }`
                );
                triggerSetPage(Pages.ReadyToLaunch);
              }}
            >
              <FlightTakeoff />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={(() => {
              switch (connective) {
                case false:
                  return tr("ServerList.NoConnection");
                case true:
                  return tr("ServerList.Connectable");
                case undefined:
                default:
                  return tr("ServerList.Testing");
              }
            })()}
          >
            <IconButton
              style={{
                marginRight: 0,
              }}
            >
              {connective === undefined ? (
                <SignalCellularAlt />
              ) : connective ? (
                <SignalCellular4Bar />
              ) : (
                <SignalCellularConnectedNoInternet0Bar />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </AccordionSummary>
      <AccordionDetails className={classes.acc1}>
        <GameCoreSelector address={props.address} cores={props.cores} />
      </AccordionDetails>
    </Accordion>
  );
}
const USED_CORE_HEAD = "ServerList.LastUsedCore.";

function setLastUsedCore(address: string, core: string): void {
  window.sessionStorage.setItem(USED_CORE_HEAD + address, core);
}

function getLastUsedCore(address: string): string {
  return window.sessionStorage.getItem(USED_CORE_HEAD + address) || "";
}

function GameCoreSelector(props: {
  address: string;
  cores: string[];
}): JSX.Element {
  const classes = useFormStyles();
  const fullWidthClasses = fullWidth();
  const [currentCore, setCurrentCore] = useState<string>(
    getLastUsedCore(props.address)
  );
  return (
    <Box className={classes.root}>
      <FormControl>
        <InputLabel id={"Select-Core"} className={classes.labelLight}>
          {tr("ServerList.UseCore")}
        </InputLabel>
        <Select
          labelId={"Select-Core"}
          className={classes.selectorLight + " " + fullWidthClasses.largerForm}
          onChange={(e) => {
            const sj = String(e.target.value);
            setCurrentCore(sj);
            setLastUsedCore(props.address, sj);
          }}
          value={currentCore}
        >
          {props.cores.map((j) => {
            return (
              <MenuItem key={j} value={j}>
                {j}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
}
