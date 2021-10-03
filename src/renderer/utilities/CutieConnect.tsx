import {
  Box,
  Button,
  FormControl,
  MuiThemeProvider,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@material-ui/core";
import { ipcRenderer } from "electron";
import React, { useEffect, useRef, useState } from "react";
import { getBoolean, getString } from "../../modules/config/ConfigSupport";
import { killEdge, runEdge } from "../../modules/cutie/BootEdge";
import { applyCode, OnlineGameInfo } from "../../modules/cutie/Hoofoff";
import { generateWorldAnyUniqueId } from "../../modules/security/Unique";
import { jumpTo, setChangePageWarn, triggerSetPage } from "../GoTo";
import {
  ALICORN_DEFAULT_THEME_DARK,
  ALICORN_DEFAULT_THEME_LIGHT,
} from "../Renderer";
import { useTextStyles } from "../Stylex";
import { randsl, tr } from "../Translator";

export const HOOFOFF_CENTRAL = "hoofoff.xuogroup.top";
export const NETWORK_PORT = 30282;
export const QUERY_PORT = 30280;

const SUPERNODE_KEY = "Utilities.CutieConnect.Supernode";
const COMMUNITY_KEY = "Utilities.CutieConnect.Community";
const PASSWORD_KEY = "Utilities.CutieConnect.Password";
const IP_KEY = "Utilities.CutieConnect.IP";
const INTERNET = "internet";

export function CutieConnet(): JSX.Element {
  const randip = generateRandIP();
  const [superNode, setSuperNode] = useState(
    window.localStorage.getItem(SUPERNODE_KEY) || ""
  );
  const [hostIp, setHostIp] = useState(
    window.localStorage.getItem(IP_KEY) || randip
  );
  const [communityName, setCommunityName] = useState(
    window.localStorage.getItem(COMMUNITY_KEY) ||
      randsl("Utilities.CutieConnect.AvailablePrefix") +
        generateWorldAnyUniqueId().slice(-10) // Random name
  );

  const [superNodeError, setSuperNodeError] = useState(!checkHost(superNode));
  const [password, setPassword] = useState(
    window.localStorage.getItem(PASSWORD_KEY) ||
      randsl("Utilities.CutieConnect.AvailablePassword") +
        generateWorldAnyUniqueId().slice(-20)
  );
  const [ipError, setIPError] = useState(!validateIP(hostIp));
  const [openHint, setOpenHint] = useState(false);
  const text = useTextStyles();
  const [notice, setNotice] = useState("");
  const [tabIndex, setTabIndex] = useState(0);
  const [hoofoffCode, setHoofoffCode] = useState("");
  const [gameMeta, setGameMeta] = useState<OnlineGameInfo>();
  return (
    <Box>
      <Tabs
        value={tabIndex}
        onChange={(_e, v) => {
          setTabIndex(v);
        }}
      >
        <Tab
          label={
            <Typography color={"primary"}>
              {tr("Utilities.CutieConnect.JoinWithCode")}
            </Typography>
          }
        />
        <Tab
          style={{
            display: getBoolean("dev.experimental") ? "inherit" : "none",
          }}
          label={
            <Typography color={"primary"}>
              {tr("Utilities.CutieConnect.Advanced")}
            </Typography>
          }
        />
      </Tabs>
      <TabPanel index={0} value={tabIndex}>
        <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
          <br />
          <br />
          <FormControl>
            <TextField
              autoFocus
              color={"primary"}
              variant={"outlined"}
              error={hoofoffCode.length > 0 && hoofoffCode.length !== 6}
              spellCheck={false}
              margin={"dense"}
              value={hoofoffCode}
              label={tr("Utilities.CutieConnect.EnterCode")}
              onChange={(e) => {
                setHoofoffCode(e.target.value);
              }}
            />
            <Button
              color={"primary"}
              variant={"contained"}
              onClick={async () => {
                try {
                  setChangePageWarn(true);
                  const d = await applyCode(
                    hoofoffCode,
                    getString("hoofoff.central", HOOFOFF_CENTRAL, true) +
                      ":" +
                      QUERY_PORT
                  );
                  setGameMeta(d);
                  setTimeout(async () => {
                    await runEdge(
                      d.network,
                      d.password,
                      "", // randip, auto assign
                      getString("hoofoff.central", HOOFOFF_CENTRAL, true) +
                        ":" +
                        NETWORK_PORT
                    );
                    setNotice(tr("Utilities.CutieConnect.AllDone"));
                    setOpenHint(true);
                    setTimeout(() => {
                      jumpTo("/LaunchPad/" + d.ip + ":" + d.port);
                      triggerSetPage("LaunchPad");
                    }, 10000);
                  }, 5000);
                  setChangePageWarn(false);
                } catch {
                  setNotice(tr("Utilities.CutieConnect.FailedToQuery"));
                  setOpenHint(true);
                }
              }}
            >
              {tr("Utilities.CutieConnect.Activate")}
            </Button>
            <br />
            <Button
              color={"primary"}
              variant={"contained"}
              onClick={async () => {
                await killEdge();
                setNotice(tr("Utilities.CutieConnect.Disconnected"));
                setOpenHint(true);
              }}
            >
              {tr("Utilities.CutieConnect.Disconnect")}
            </Button>
          </FormControl>
        </MuiThemeProvider>
        <br />
        <br />
        {gameMeta ? (
          <Typography className={text.secondText} color={"secondary"}>
            {tr(
              "Utilities.CutieConnect.GameMeta",
              `BaseVersion=${gameMeta.baseVersion}`,
              `IsPremium=${tr(
                gameMeta.premium
                  ? "Utilities.CutieConnet.Premium"
                  : "Utilities.CutieConnet.NonPremium"
              )}`,
              `Message=${gameMeta.message
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")}`
            )}
          </Typography>
        ) : (
          ""
        )}
      </TabPanel>
      <TabPanel index={1} value={tabIndex}>
        <Box>
          <Box>
            <Typography className={text.secondText}>
              {tr("Utilities.CutieConnect.QuickHint", `RandIP=${randip}`)}
            </Typography>
            <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
              <TextField
                error={ipError}
                color={"primary"}
                variant={"outlined"}
                style={{
                  width: "49%",
                  float: "left",
                }}
                onChange={(e) => {
                  setHostIp(e.target.value.trim());
                  setIPError(!validateIP(e.target.value.trim()));
                  window.localStorage.setItem(IP_KEY, e.target.value.trim());
                }}
                spellCheck={false}
                margin={"dense"}
                value={hostIp}
                label={
                  ipError
                    ? tr("Utilities.CutieConnect.InvalidIP")
                    : tr("Utilities.CutieConnect.IP")
                }
              />
              <TextField
                color={"primary"}
                variant={"outlined"}
                disabled={communityName === INTERNET}
                style={{
                  width: "49%",
                  float: "right",
                }}
                onChange={(e) => {
                  setPassword(e.target.value.trim());
                  window.localStorage.setItem(
                    PASSWORD_KEY,
                    e.target.value.trim()
                  );
                }}
                spellCheck={false}
                margin={"dense"}
                value={password}
                label={
                  communityName === INTERNET
                    ? tr("Utilities.CutieConnect.NoPassword")
                    : tr("Utilities.CutieConnect.Password")
                }
              />
              <br />
              <TextField
                error={superNodeError}
                color={"primary"}
                variant={"outlined"}
                fullWidth
                onChange={(e) => {
                  setSuperNode(e.target.value.trim());
                  setSuperNodeError(!checkHost(e.target.value.trim()));
                  window.localStorage.setItem(
                    SUPERNODE_KEY,
                    e.target.value.trim()
                  );
                }}
                style={{
                  width: "49%",
                  float: "left",
                }}
                spellCheck={false}
                margin={"dense"}
                value={superNode}
                label={
                  superNodeError
                    ? tr("Utilities.CutieConnect.InvalidSupernode")
                    : tr("Utilities.CutieConnect.Supernode")
                }
              />
              <TextField
                color={"primary"}
                variant={"outlined"}
                fullWidth
                onChange={(e) => {
                  setCommunityName(e.target.value.trim());
                  window.localStorage.setItem(
                    COMMUNITY_KEY,
                    e.target.value.trim()
                  );
                }}
                style={{
                  width: "49%",
                  float: "right",
                }}
                spellCheck={false}
                margin={"dense"}
                value={communityName}
                label={
                  communityName === INTERNET
                    ? tr("Utilities.CutieConnect.CommunityIsInternet")
                    : tr("Utilities.CutieConnect.Community")
                }
              />
              <br />
              <Button
                disabled={
                  ipError ||
                  superNodeError ||
                  hostIp.length === 0 ||
                  superNode.length === 0
                }
                color={"primary"}
                variant={"contained"}
                onClick={async () => {
                  window.localStorage.setItem(SUPERNODE_KEY, superNode);
                  window.localStorage.setItem(PASSWORD_KEY, password);
                  window.localStorage.setItem(COMMUNITY_KEY, communityName);
                  window.localStorage.setItem(IP_KEY, hostIp); // Freeze Data
                  await runEdge(
                    communityName,
                    communityName === INTERNET ? "" : password,
                    hostIp,
                    superNode
                  );
                  setNotice(tr("Utilities.CutieConnect.Connected"));
                  setOpenHint(true);
                }}
              >
                {tr("Utilities.CutieConnect.Connect")}
              </Button>
              <Button
                style={{ marginLeft: "4px" }}
                color={"primary"}
                variant={"contained"}
                onClick={async () => {
                  await killEdge();
                  setNotice(tr("Utilities.CutieConnect.Disconnected"));
                  setOpenHint(true);
                }}
              >
                {tr("Utilities.CutieConnect.Disconnect")}
              </Button>
            </MuiThemeProvider>
          </Box>
        </Box>
      </TabPanel>
      <Snackbar
        open={openHint}
        message={notice}
        autoHideDuration={5000}
        onClose={() => {
          setOpenHint(false);
        }}
      />
    </Box>
  );
}
const VALID_IP_POST_REGEX =
  /^(((\d{1,2})|(1\d{2})|(2[0-4]\d)|(25[0-5]))\.){3}((\d{1,2})|(1\d{2})|(2[0-4]\d)|(25[0-5]))$/;
const DOMAIN_REGEX =
  /^(?=^.{3,255}$)[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+$/;
function validateIP(i: string): boolean {
  if (i.length === 0) {
    return true;
  }
  return VALID_IP_POST_REGEX.test(i);
}

function generateRandIP(): string {
  const o = [];
  if (Math.random() > 0.5) {
    // Use 10
    o.push("10", get255Num(), get255Num(), get255Num());
  } else {
    // Use 172

    o.push("172", get16to31Num(), get255Num(), get255Num());
  }
  return o.join(".");
}

function get255Num(): string {
  return Math.floor(Math.random() * 245 + 10).toString(); // But not 1 or 0!
}
function get16to31Num(): string {
  return Math.floor(Math.random() * 15 + 16).toString();
}

function checkHost(h: string): boolean {
  if (h.length === 0) {
    return true;
  }
  if (h.trim().length !== h.length) {
    return false;
  }
  const p = h.split(":");
  if (p.length !== 2) {
    return false;
  }
  const port = parseInt(p[1]);
  if (String(port) !== p[1]) {
    return false;
  }

  if (isNaN(port)) {
    return false;
  }
  if (port < 0 || port > 65535) {
    return false;
  }
  const host = p[0];
  if (validateIP(host)) {
    return true;
  }
  if (DOMAIN_REGEX.test(host)) {
    return true;
  }
  return false;
}

function GameDisplay(props: {
  name: string;
  desc: string;
  host: string;
}): JSX.Element {
  const text = useTextStyles();
  const [reachable, setReachable] = useState();
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  });
  useEffect(() => {
    void (async () => {
      const st = await ipcRenderer.invoke("isReachable", props.host);
      if (mounted.current) {
        setReachable(st);
      }
    })();
  }, []);
  return (
    <Box
      style={{
        marginLeft: "4%",
      }}
      onClick={() => {
        jumpTo("/LaunchPad/" + props.host);
        triggerSetPage("LaunchPad");
      }}
    >
      <Typography
        className={text.thirdTextRaw}
        style={{
          color:
            reachable === undefined
              ? ALICORN_DEFAULT_THEME_DARK.palette.primary.light
              : reachable
              ? ALICORN_DEFAULT_THEME_DARK.palette.primary.main
              : "gray",
        }}
      >
        {props.name}
      </Typography>
      <Typography className={text.secondText} gutterBottom>
        {props.host + " - " + props.desc}
      </Typography>
    </Box>
  );
}

function getMapHostBySupernode(h: string): string {
  const ps = h.split(":");
  ps[1] = (parseInt(ps[1]) - 1).toString();
  return "ws://" + ps.join(":");
}

function validatePort(p: string): boolean {
  const s = parseInt(p);
  return s >= 0 && s <= 65535;
}
function TabPanel(props: {
  children?: React.ReactNode;
  index: string | number;
  value: string | number;
}): JSX.Element {
  const { children, value, index } = props;
  return (
    <Box hidden={value !== index}>
      {value === index ? <Box>{children}</Box> : ""}
    </Box>
  );
}
