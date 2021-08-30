import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@material-ui/core";
import { ipcRenderer } from "electron";
import React, { useEffect, useState } from "react";
import { randsl, tr } from "./Translator";

export function OperatingHint(props: { open: boolean }): JSX.Element {
  const [saying, setSaying] = useState<string>(
    randsl("ReadyToLaunch.WaitingText")
  );
  useEffect(() => {
    const t = setInterval(() => {
      setSaying(randsl("ReadyToLaunch.WaitingText"));
    }, 5000);
    return () => {
      clearInterval(t);
    };
  });
  return (
    <Dialog open={props.open} disableEscapeKeyDown>
      <DialogTitle>{tr("Operating.PleaseWait")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {tr("Operating.PleaseWaitDetail")}
        </DialogContentText>
        <DialogContentText>
          <i>{saying}</i>
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
}

export function OperatingHintCustom(props: {
  open: boolean;
  msg: string;
}): JSX.Element {
  const [saying, setSaying] = useState<string>(
    randsl("ReadyToLaunch.WaitingText")
  );
  useEffect(() => {
    const t = setInterval(() => {
      setSaying(randsl("ReadyToLaunch.WaitingText"));
    }, 5000);
    return () => {
      clearInterval(t);
    };
  });
  return (
    <Dialog open={props.open} disableEscapeKeyDown>
      <DialogTitle>{tr("Operating.PleaseWait")}</DialogTitle>
      <DialogContent>
        <DialogContentText>{props.msg}</DialogContentText>
        <DialogContentText>
          <i>{saying}</i>
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
}

export function FailedHint(props: {
  open: boolean;
  closeFunc: () => unknown;
  reason?: string;
}): JSX.Element {
  const reason = props.reason || tr("Operating.FailedInfo");
  return (
    <Dialog open={props.open} onClose={props.closeFunc}>
      <Box>
        <DialogTitle>{tr("Operating.Failed")}</DialogTitle>
        <DialogContent
          onClick={() => {
            void ipcRenderer.send("openDevTools");
          }}
        >
          <DialogContentText>{reason}</DialogContentText>
          <DialogContentText>
            <b>{tr("Operating.ClickToDebug")}</b>
            <br />
            <i>{randsl("Operating.FailedSayings")}</i>
          </DialogContentText>
        </DialogContent>
      </Box>

      <DialogActions>
        <Button onClick={props.closeFunc}>
          {tr("Operating.FailedConfirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function YNDialog(props: {
  onClose: () => unknown;
  onAccept: () => unknown;
  title: string;
  content: string;
  yes: string;
  no: string;
  open?: boolean;
}): JSX.Element {
  const [open, setOpen] = useState<boolean>(true);
  return (
    <Dialog
      open={open}
      onClose={() => {
        setOpen(false);
        props.onClose();
      }}
    >
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{props.content}</DialogContentText>
        <DialogActions>
          <Button
            onClick={() => {
              props.onAccept();
              setOpen(false);
            }}
          >
            {props.yes}
          </Button>
          <Button
            onClick={() => {
              setOpen(false);
              props.onClose();
            }}
          >
            {props.no}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}

export function YNDialog2(props: {
  onClose: () => unknown;
  onAccept: () => unknown;
  title: string;
  content: string;
  yes: string;
  no: string;
  open: boolean;
  noProp?: boolean;
}): JSX.Element {
  return (
    <Dialog
      open={props.open}
      onClose={(e) => {
        props.onClose();
      }}
      onClick={(e) => {
        if (props.noProp) {
          e.stopPropagation();
        }
      }}
    >
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{props.content}</DialogContentText>
        <DialogActions>
          <Button
            onClick={(e) => {
              if (props.noProp) {
                e.stopPropagation();
              }
              props.onAccept();
              props.onClose();
            }}
          >
            {props.yes}
          </Button>
          <Button
            onClick={(e) => {
              if (props.noProp) {
                e.stopPropagation();
              }
              props.onClose();
            }}
          >
            {props.no}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
