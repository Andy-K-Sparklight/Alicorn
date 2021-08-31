import {
  Box,
  Button,
  MuiThemeProvider,
  Snackbar,
  TextField,
  Typography,
} from "@material-ui/core";
import { ipcRenderer } from "electron";
import React, { useEffect, useRef, useState } from "react";
import { killEdge, runEdge } from "../../modules/cutie/BootEdge";
import {
  askCreate,
  askRemove,
  makeQuery,
  QueryResult,
} from "../../modules/cutie/CutieMap";
import {
  generateWorldAnyUniqueId,
  instantGetMachineUniqueID,
} from "../../modules/security/Unique";
import { jumpTo, triggerSetPage } from "../GoTo";
import {
  ALICORN_DEFAULT_THEME_DARK,
  ALICORN_DEFAULT_THEME_LIGHT,
} from "../Renderer";
import { useTextStyles } from "../Stylex";
import { randsl, tr } from "../Translator";

const SUPERNODE_KEY = "Utilities.CutieConnect.Supernode";
const COMMUNITY_KEY = "Utilities.CutieConnect.Community";
const PASSWORD_KEY = "Utilities.CutieConnect.Password";
const IP_KEY = "Utilities.CutieConnect.IP";
const PORT_KEY = "Utilities.CutieConnect.LocalPort";
const WORLD_KEY = "Utilities.CutieConnect.WorldName";
const DESC_KEY = "Utilities.CutieConnect.Desc";
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
  const [seeSearchResult, setSeeSearchResult] = useState(false);
  const [result, setResult] = useState<QueryResult>({});
  const [localPort, setLocalPort] = useState(
    window.localStorage.getItem(PORT_KEY) || "25565"
  );
  const [worldName, setWorldName] = useState(
    window.localStorage.getItem(WORLD_KEY) ||
      randsl("Utilities.CutieConnect.AvailableWorldName")
  );
  const [desc, setDesc] = useState(
    window.localStorage.getItem(DESC_KEY) ||
      randsl("Utilities.CutieConnect.AvailableDesc")
  );
  const text = useTextStyles();
  const [notice, setNotice] = useState("");
  return (
    <Box>
      {seeSearchResult ? (
        <Box>
          <Typography className={text.firstText}>
            {tr("Utilities.CutieConnect.Games")}
          </Typography>
          <Typography className={text.secondText}>
            {tr("Utilities.CutieConnect.ClickToJoin")}
          </Typography>
          <br />
          <Button
            color={"primary"}
            variant={"contained"}
            onClick={() => {
              setSeeSearchResult(false);
            }}
          >
            {tr("Utilities.CutieConnect.GoBack")}
          </Button>
          <br />
          {Object.keys(result).map((host) => {
            return (
              <GameDisplay
                host={host}
                key={host}
                desc={result[host][1]}
                name={result[host][0]}
              />
            );
          })}
        </Box>
      ) : (
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
              onClick={() => {
                window.localStorage.setItem(SUPERNODE_KEY, superNode);
                window.localStorage.setItem(PASSWORD_KEY, password);
                window.localStorage.setItem(COMMUNITY_KEY, communityName);
                window.localStorage.setItem(IP_KEY, hostIp); // Freeze Data
                runEdge(
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
              onClick={() => {
                killEdge();
                setNotice(tr("Utilities.CutieConnect.Disconnected"));
                setOpenHint(true);
              }}
            >
              {tr("Utilities.CutieConnect.Disconnect")}
            </Button>
            <Button
              disabled={communityName.length === 0 || superNodeError}
              style={{ marginLeft: "4px" }}
              color={"primary"}
              variant={"contained"}
              onClick={() => {
                void (async () => {
                  let r;
                  try {
                    r = await makeQuery(
                      communityName,
                      getMapHostBySupernode(superNode)
                    );
                    if (Object.keys(r).length === 0) {
                      setNotice(tr("Utilities.CutieConnect.NoResult"));
                    } else {
                      setNotice(
                        tr(
                          "Utilities.CutieConnect.Result",
                          `Count=${Object.keys(r).length}`
                        )
                      );
                      setResult(r);
                      setSeeSearchResult(true);
                    }
                  } catch (e) {
                    console.log(e);
                    r = {};
                    setNotice(
                      tr("Utilities.CutieConnect.Error", `Message=${e}`)
                    );
                  }
                  setOpenHint(true);
                })();
              }}
            >
              {tr("Utilities.CutieConnect.NetworkSearch")}
            </Button>
            <br />
            <br />
            <TextField
              error={!validatePort(localPort)}
              color={"primary"}
              variant={"outlined"}
              fullWidth
              onChange={(e) => {
                setLocalPort(e.target.value.trim());
                window.localStorage.setItem(PORT_KEY, e.target.value.trim());
              }}
              style={{
                width: "49%",
                float: "left",
              }}
              spellCheck={false}
              margin={"dense"}
              value={localPort}
              label={
                validatePort(localPort)
                  ? tr("Utilities.CutieConnect.Port")
                  : tr("Utilities.CutieConnect.InvalidPort")
              }
            />
            <TextField
              color={"primary"}
              variant={"outlined"}
              fullWidth
              onChange={(e) => {
                setWorldName(e.target.value);
                window.localStorage.setItem(WORLD_KEY, e.target.value);
              }}
              style={{
                width: "49%",
                float: "right",
              }}
              spellCheck={false}
              margin={"dense"}
              value={worldName}
              label={tr("Utilities.CutieConnect.WorldName")}
            />

            <TextField
              color={"primary"}
              variant={"outlined"}
              fullWidth
              onChange={(e) => {
                setDesc(e.target.value);
                window.localStorage.setItem(DESC_KEY, e.target.value);
              }}
              spellCheck={false}
              margin={"dense"}
              value={desc}
              label={tr("Utilities.CutieConnect.DescWorld")}
            />
            <br />
            <Button
              disabled={
                worldName.length === 0 ||
                desc.length === 0 ||
                ipError ||
                superNodeError
              }
              color={"primary"}
              variant={"contained"}
              onClick={() => {
                void (async () => {
                  try {
                    const o = hostIp + ":" + localPort;
                    if (await ipcRenderer.invoke("isReachable", o, 3000)) {
                      await askCreate(
                        communityName,
                        o,
                        instantGetMachineUniqueID(),
                        worldName,
                        desc,
                        getMapHostBySupernode(superNode)
                      );
                      setNotice(
                        tr(
                          "Utilities.CutieConnect.PublishOK",
                          `Community=${communityName}`,
                          `WorldName=${worldName}`
                        )
                      );
                    } else {
                      setNotice(
                        tr(
                          "Utilities.CutieConnect.PublishPrecheckFailed",
                          `Host=${o}`
                        )
                      );
                    }
                  } catch (e) {
                    console.log(e);
                    setNotice(
                      tr("Utilities.CutieConnect.Error", `Message=${e}`)
                    );
                  }
                  setOpenHint(true);
                })();
              }}
            >
              {tr("Utilities.CutieConnect.PublishToMap")}
            </Button>
            <Button
              disabled={ipError || superNodeError}
              style={{ marginLeft: "4px" }}
              color={"primary"}
              variant={"contained"}
              onClick={() => {
                void (async () => {
                  try {
                    const o = hostIp + ":" + localPort;
                    await askRemove(
                      communityName,
                      o,
                      instantGetMachineUniqueID(),
                      getMapHostBySupernode(superNode)
                    );
                    setNotice(
                      tr(
                        "Utilities.CutieConnect.RemoveOK",
                        `Community=${communityName}`,
                        `WorldName=${worldName}`
                      )
                    );
                  } catch (e) {
                    console.log(e);
                    setNotice(
                      tr("Utilities.CutieConnect.Error", `Message=${e}`)
                    );
                  }
                  setOpenHint(true);
                })();
              }}
            >
              {tr("Utilities.CutieConnect.Unpublish")}
            </Button>
          </MuiThemeProvider>
        </Box>
      )}
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
