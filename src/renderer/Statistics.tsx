import { Box, Typography } from "@mui/material";
import React from "react";
import { buildMap, parseMap } from "../modules/commons/MapUtil";
import { useTextStyles } from "./Stylex";
import { randsl, tr } from "./Translator";
let STATISTICS_MAP: Map<string, number> = new Map();
const ALL_STATS = ["Click", "Launch", "Crash"];
export function Statistics(): JSX.Element {
  const classes = useTextStyles();
  return (
    <>
      {ALL_STATS.map((v) => {
        const s = getStatistics(v);
        return (
          <>
            <Box key={v} style={{ display: "flex" }}>
              <Typography className={classes.mediumText}>
                {
                  tr(
                    "Statistics." + v,
                    `Value=${s}`
                  ) /* randsl to apply condition */
                }
              </Typography>
              <Typography
                className={classes.secondText}
                style={{ marginLeft: "auto" }}
              >
                {randsl("Statistics." + v + ".As", `Value=${s}`)}
              </Typography>
            </Box>
            <br />
          </>
        );
      })}
    </>
  );
}

export function initStatistics(): void {
  loadStatistics();
  window.addEventListener("click", () => {
    addStatistics("Click");
  });
  window.addEventListener("keydown", () => {
    addStatistics("Keyboard");
  });
}

export function addStatistics(i: string, amount = 1): void {
  STATISTICS_MAP.set(i, (STATISTICS_MAP.get(i) || 0) + amount);
}

export function getStatistics(i: string): number {
  return STATISTICS_MAP.get(i) || 0;
}

export function saveStatistics(): void {
  window.localStorage.setItem("Statistics", buildMap(STATISTICS_MAP));
}

export function loadStatistics(): void {
  STATISTICS_MAP = parseMap(window.localStorage.getItem("Statistics") || "");
}
