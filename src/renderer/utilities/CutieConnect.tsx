import {
  Box,
  Button,
  MuiThemeProvider,
  Snackbar,
  TextField,
  Typography,
} from "@material-ui/core";
import React, { useState } from "react";
import { killEdge, runEdge } from "../../modules/n2n/BootEdge";
import { generateWorldAnyUniqueId } from "../../modules/security/Unique";
import { ALICORN_DEFAULT_THEME_LIGHT } from "../Renderer";
import { useTextStyles } from "../Stylex";
import { randsl, tr } from "../Translator";

const SUPERNODE_KEY = "Utilities.CutieConnect.Supernode";
const COMMUNITY_KEY = "Utilities.CutieConnect.Community";
const PASSWORD_KEY = "Utilities.CutieConnect.Password";
const IP_KEY = "Utilities.CutieConnect.IP";

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
  return (
    <Box>
      <Typography className={text.secondText}>
        {tr("Utilities.CutieConnect.QuickHint", `RandIP=${randip}`)}
      </Typography>
      <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
        <TextField
          error={ipError}
          color={"primary"}
          variant={"outlined"}
          fullWidth
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
        <br />
        <TextField
          color={"primary"}
          variant={"outlined"}
          fullWidth
          onChange={(e) => {
            setPassword(e.target.value.trim());
            window.localStorage.setItem(PASSWORD_KEY, e.target.value.trim());
          }}
          spellCheck={false}
          margin={"dense"}
          value={password}
          label={tr("Utilities.CutieConnect.Password")}
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
            window.localStorage.setItem(SUPERNODE_KEY, e.target.value.trim());
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
        <br />
        <TextField
          color={"primary"}
          variant={"outlined"}
          fullWidth
          onChange={(e) => {
            setCommunityName(e.target.value.trim());
            window.localStorage.setItem(COMMUNITY_KEY, e.target.value.trim());
          }}
          spellCheck={false}
          margin={"dense"}
          value={communityName}
          label={tr("Utilities.CutieConnect.Community")}
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
            runEdge(communityName, password, hostIp, superNode);
            setNotice("Utilities.CutieConnect.Connected");
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
            setNotice("Utilities.CutieConnect.Disconnected");
            setOpenHint(true);
          }}
        >
          {tr("Utilities.CutieConnect.Disconnect")}
        </Button>
        <Snackbar
          open={openHint}
          message={tr(notice)}
          autoHideDuration={3000}
          onClose={() => {
            setOpenHint(false);
          }}
        />
      </MuiThemeProvider>
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
