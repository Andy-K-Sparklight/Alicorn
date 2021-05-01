import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@material-ui/core";
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
    <Dialog open={props.open} disableBackdropClick disableEscapeKeyDown>
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

export function FailedHint(props: {
  open: boolean;
  closeFunc: () => unknown;
}): JSX.Element {
  return (
    <Dialog open={props.open} onClose={props.closeFunc}>
      <DialogTitle>{tr("Operating.Failed")}</DialogTitle>
      <DialogContent>
        <DialogContentText>{tr("Operating.FailedInfo")}</DialogContentText>
        <DialogContentText>
          <i>{randsl("Operating.FailedSayings")}</i>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.closeFunc}>
          {tr("Operating.FailedConfirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
