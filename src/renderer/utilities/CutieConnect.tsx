import {
  Box,
  Button,
  FormControl,
  Tab,
  Tabs,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { getBoolean, getString } from "../../modules/config/ConfigSupport";
import {
  killEdge,
  prepareServerDat,
  runEdge,
} from "../../modules/cutie/BootEdge";
import { applyCode, OnlineGameInfo } from "../../modules/cutie/Hoofoff";
import { generateWorldAnyUniqueId } from "../../modules/security/Unique";
import { jumpTo, setChangePageWarn, triggerSetPage } from "../GoTo";
import { submitInfo, submitSucc, submitWarn } from "../Message";
import { ALICORN_DEFAULT_THEME_LIGHT } from "../Renderer";
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
    localStorage.getItem(SUPERNODE_KEY) || ""
  );
  const [hostIp, setHostIp] = useState(localStorage.getItem(IP_KEY) || randip);
  const [communityName, setCommunityName] = useState(
    localStorage.getItem(COMMUNITY_KEY) ||
      randsl("Utilities.CutieConnect.AvailablePrefix") +
        generateWorldAnyUniqueId().slice(-10) // Random name
  );

  const [superNodeError, setSuperNodeError] = useState(!checkHost(superNode));
  const [password, setPassword] = useState(
    localStorage.getItem(PASSWORD_KEY) ||
      randsl("Utilities.CutieConnect.AvailablePassword") +
        generateWorldAnyUniqueId().slice(-20)
  );
  const [ipError, setIPError] = useState(!validateIP(hostIp));
  const text = useTextStyles();
  const [tabIndex, setTabIndex] = useState(0);
  const [hoofoffCode, setHoofoffCode] = useState("");
  const [gameMeta, setGameMeta] = useState<OnlineGameInfo>();
  return (
    <>
      <Tabs
        variant={"fullWidth"}
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
          sx={{
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
        <ThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
          <br />
          <br />
          <FormControl sx={{ width: "100%" }}>
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
                    await killEdge();
                    await runEdge(
                      d.network,
                      d.password,
                      "10.16.32." + d.nextIP,
                      getString("hoofoff.central", HOOFOFF_CENTRAL, true) +
                        ":" +
                        NETWORK_PORT
                    );
                    submitSucc(tr("Utilities.CutieConnect.AllDone"));
                    await Promise.all([
                      prepareServerDat(
                        d.ip + ":" + d.port,
                        `${hoofoffCode} (${d.baseVersion})`
                      ),
                      new Promise<void>((res) => {
                        setTimeout(() => {
                          res();
                        }, 10000);
                      }),
                    ]);
                    jumpTo("/LaunchPad");
                    triggerSetPage("LaunchPad");
                  }, 5000);
                  setChangePageWarn(false);
                } catch {
                  submitWarn(tr("Utilities.CutieConnect.FailedToQuery"));
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
                submitInfo(tr("Utilities.CutieConnect.Disconnected"));
              }}
            >
              {tr("Utilities.CutieConnect.Disconnect")}
            </Button>
          </FormControl>
        </ThemeProvider>
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
        <>
          <Typography className={text.secondText}>
            {tr("Utilities.CutieConnect.QuickHint", `RandIP=${randip}`)}
          </Typography>
          <ThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
            <TextField
              error={ipError}
              color={"primary"}
              variant={"outlined"}
              sx={{
                width: "49%",
                float: "left",
              }}
              onChange={(e) => {
                setHostIp(e.target.value.trim());
                setIPError(!validateIP(e.target.value.trim()));
                localStorage.setItem(IP_KEY, e.target.value.trim());
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
              sx={{
                width: "49%",
                float: "right",
              }}
              onChange={(e) => {
                setPassword(e.target.value.trim());
                localStorage.setItem(PASSWORD_KEY, e.target.value.trim());
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
                localStorage.setItem(SUPERNODE_KEY, e.target.value.trim());
              }}
              sx={{
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
                localStorage.setItem(COMMUNITY_KEY, e.target.value.trim());
              }}
              sx={{
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
                localStorage.setItem(SUPERNODE_KEY, superNode);
                localStorage.setItem(PASSWORD_KEY, password);
                localStorage.setItem(COMMUNITY_KEY, communityName);
                localStorage.setItem(IP_KEY, hostIp); // Freeze Data
                await killEdge();
                await runEdge(
                  communityName,
                  communityName === INTERNET ? "" : password,
                  hostIp,
                  superNode
                );
                submitSucc(tr("Utilities.CutieConnect.Connected"));
              }}
            >
              {tr("Utilities.CutieConnect.Connect")}
            </Button>
            <Button
              sx={{ marginLeft: "0.25rem" }}
              color={"primary"}
              variant={"contained"}
              onClick={async () => {
                await killEdge();
                submitInfo(tr("Utilities.CutieConnect.Disconnected"));
              }}
            >
              {tr("Utilities.CutieConnect.Disconnect")}
            </Button>
          </ThemeProvider>
        </>
      </TabPanel>
    </>
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

function TabPanel(props: {
  children?: React.ReactNode;
  index: string | number;
  value: string | number;
}): JSX.Element {
  const { children, value, index } = props;
  return (
    <Box hidden={value !== index}>{value === index ? <>{children}</> : ""}</Box>
  );
}
