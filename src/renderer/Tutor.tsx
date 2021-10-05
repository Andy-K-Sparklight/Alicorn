import { Box, Button, MuiThemeProvider, Typography } from "@material-ui/core";
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { getString, set } from "../modules/config/ConfigSupport";
import { whereJava } from "../modules/java/WhereJava";
import { jumpTo, triggerSetPage } from "./GoTo";
import { ConfigType, InputItem } from "./Options";
import { ALICORN_DEFAULT_THEME_LIGHT } from "./Renderer";
import { useTextStyles } from "./Stylex";
import { tr } from "./Translator";
const NEXT_TUTOR_INDEX = "Tutor.NextUrl";
const SHOW_ICNS: Set<string> = new Set();
export function isTutor(): boolean {
  return getString("startup-page.name") === "Tutor";
}

export function isShow(iconName: string): boolean {
  return SHOW_ICNS.has(iconName);
}

export function setNextTutorIndex(u: string): void {
  window.sessionStorage.setItem(NEXT_TUTOR_INDEX, u);
}

export function getNextTutorIndex(): string {
  return window.sessionStorage.getItem(NEXT_TUTOR_INDEX) || "0";
}

export function getNextTutorName(): string {
  return TUTOR_PAGES[parseInt(getNextTutorIndex())];
}

const TUTOR_PAGES = [
  "0",
  "Quick",
  "1",
  "2",
  "3",
  "4",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "EG1",
  "End1",
];

export function Tutor(): JSX.Element {
  const classes = useTextStyles();
  let { page } = useParams<{ page: string }>();
  page = decodeURIComponent(page);
  const control = tr(`Tutor.${page}.Controller`);
  useEffect(() => {
    if (page === "0") {
      whereJava(true)
        .then(() => {})
        .catch(() => {}); // Pre init task
    }
  }, []);
  useEffect(() => {
    const h = window.location.hash.split("/").pop();
    setNextTutorIndex((TUTOR_PAGES.indexOf(h || "") + 1).toString());
  });
  useEffect(() => {
    control.split(";").forEach((a) => {
      if (a.startsWith("-")) {
        SHOW_ICNS.delete(a.slice(1));
        window.dispatchEvent(new CustomEvent("refreshApp"));
      }
      if (a.startsWith("+")) {
        SHOW_ICNS.add(a.slice(1));
        window.dispatchEvent(new CustomEvent("refreshApp"));
      }
      if (control === "End") {
        window.dispatchEvent(new CustomEvent("refreshApp"));
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
  // bind-config;RADIO;key-a/key-b/key-c (Setting)
  // !!;content;target;title (Button)
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
        ) : setting[0] === "!!" ? (
          <Button
            variant={"contained"}
            color={"primary"}
            onClick={() => {
              jumpTo(setting[2]);
              triggerSetPage(setting[3]);
            }}
          >
            {setting[1]}
          </Button>
        ) : (
          <Box>
            <br />
            <InputItem
              type={getConfigType(setting[1])}
              bindConfig={setting[0]}
              choices={setting[2] ? setting[2].split("/") : undefined}
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
    case "RADIO":
      return ConfigType.RADIO;
    default:
      return ConfigType.STR;
  }
}
