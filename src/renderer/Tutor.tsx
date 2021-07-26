import { Box, MuiThemeProvider, Typography } from "@material-ui/core";
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { getString, set } from "../modules/config/ConfigSupport";
import { whereJava } from "../modules/java/WhereJava";
import { jumpTo, triggerSetPage } from "./GoTo";
import { ConfigType, InputItem } from "./Options";
import { ALICORN_DEFAULT_THEME_LIGHT } from "./Renderer";
import { useTextStyles } from "./Stylex";
import { tr } from "./Translator";
const NEXT_TUTOR_URL = "Tutor.NextUrl";
const SHOW_ICNS: Set<string> = new Set();
export function isTutor(): boolean {
  return getString("startup-page.name") === "Tutor";
}

export function isShow(iconName: string): boolean {
  return SHOW_ICNS.has(iconName);
}

export function setNextTutorUrl(u: string): void {
  window.sessionStorage.setItem(NEXT_TUTOR_URL, u);
}
export function getNextTutorUrl(): string {
  return window.sessionStorage.getItem(NEXT_TUTOR_URL) || "";
}

export function Tutor(): JSX.Element {
  const classes = useTextStyles();
  const { page } = useParams<{ page: string }>();
  const control = tr(`Tutor.${page}.Controller`);
  useEffect(() => {
    if (page === "1") {
      whereJava(true)
        .then(() => {})
        .catch(() => {}); // Pre init task
    }
  }, []);
  useEffect(() => {
    const url = window.location.hash;
    const page = parseInt(url.charAt(url.length - 1));
    const nu = url.slice(0, -1) + (page + 1);
    setNextTutorUrl(nu);
  });
  useEffect(() => {
    control.split(";").forEach((a) => {
      if (a.startsWith("-")) {
        SHOW_ICNS.delete(a.slice(1));
        console.log("Sending signal!");
        window.dispatchEvent(new CustomEvent("refreshApp"));
      }
      if (a.startsWith("+")) {
        SHOW_ICNS.add(a.slice(1));
        window.dispatchEvent(new CustomEvent("refreshApp"));
      }
      if (control === "End") {
        jumpTo("/Welcome");
        triggerSetPage("Welcome");
        set("startup-page.name", "Welcome");
        set("startup-page.url", "/Welcome");
      }
    });
  });
  if (control === "End") {
    return <></>;
  }
  const settingItem = tr(`Tutor.${page}.Setting`);
  const setting = settingItem.split(";");
  return (
    <Box className={classes.root}>
      <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
        <Typography
          color={"primary"}
          className={classes.firstText}
          gutterBottom
        >
          {tr(`Tutor.${page}.Title`)}
        </Typography>
        <Typography
          color={"secondary"}
          className={classes.mediumText}
          gutterBottom
        >
          {tr(`Tutor.${page}.Content`)}
        </Typography>
        {settingItem.length === 0 ? (
          ""
        ) : (
          <Box>
            <br />
            <InputItem
              type={getConfigType(setting[1])}
              bindConfig={setting[0]}
            />
          </Box>
        )}
      </MuiThemeProvider>
    </Box>
  );
}

function getConfigType(s: string): ConfigType {
  switch (s) {
    case "BOOL":
      return ConfigType.BOOL;
    case "NUM":
      return ConfigType.NUM;
    case "DIR":
      return ConfigType.DIR;
    default:
      return ConfigType.STR;
  }
}
