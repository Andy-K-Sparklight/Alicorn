import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { shell } from "electron";
import React, { useEffect, useState } from "react";
import { set } from "../modules/config/ConfigSupport";
import {
  ALICORN_DEFAULT_THEME_DARK,
  ALICORN_DEFAULT_THEME_LIGHT,
  isBgDark,
} from "./Renderer";
import { getTip, tr } from "./Translator";

export function TipsOfToday(props: {
  open: boolean;
  onClose: () => unknown;
}): JSX.Element {
  const [tip, setTip] = useState(getTip());
  useEffect(() => {
    const fun = () => {
      props.onClose();
    };
    window.addEventListener("closeTips", fun);
    return () => {
      window.removeEventListener("closeTips", fun);
    };
  }, []);
  return (
    <ThemeProvider
      theme={
        isBgDark() ? ALICORN_DEFAULT_THEME_DARK : ALICORN_DEFAULT_THEME_LIGHT
      }
    >
      <Dialog
        open={props.open}
        onClose={() => {
          props.onClose();
        }}
        maxWidth={"sm"}
      >
        <DialogTitle>{tip.name}</DialogTitle>
        <DialogContent>
          <DialogContentText>{tip.text}</DialogContentText>
          <br />
          <img style={{ width: "100%", height: "auto" }} src={tip.img} />
        </DialogContent>
        <DialogActions>
          <Typography color={"secondary"} sx={{ fontSize: "smaller" }}>
            {tr("TipsOfToday.Desc")}
          </Typography>
          {tip.rel ? (
            <Button
              color={"primary"}
              onClick={() => {
                void shell.openExternal(String(tip.rel));
              }}
            >
              {tr("TipsOfToday.More")}
            </Button>
          ) : (
            ""
          )}
          <Button
            color={"primary"}
            onClick={() => {
              setTip(getTip());
            }}
          >
            {tr("TipsOfToday.Next")}
          </Button>
          <Button
            color={"primary"}
            onClick={() => {
              set("features.tips-of-today", false);
              props.onClose();
            }}
          >
            {tr("TipsOfToday.Disable")}
          </Button>
          <Button
            color={"primary"}
            onClick={() => {
              props.onClose();
            }}
          >
            {tr("TipsOfToday.Close")}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
