import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@material-ui/core";
import React from "react";
import { tr } from "./Translator";

export function OperatingHint(props: { open: boolean }): JSX.Element {
  return (
    <Dialog open={props.open} disableBackdropClick disableEscapeKeyDown>
      <DialogTitle>{tr("Operating.PleaseWait")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {tr("Operating.PleaseWaitDetail")}
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
}
