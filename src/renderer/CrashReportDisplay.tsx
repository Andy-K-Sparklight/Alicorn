import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Box,
  Button,
  createStyles,
  List,
  ListItem,
  ListItemText,
  makeStyles,
  MuiThemeProvider,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@material-ui/core";
import { ExpandMore } from "@material-ui/icons";
import copy from "copy-to-clipboard";
import fs from "fs-extra";
import React, { useEffect, useRef, useState } from "react";
import { generateCrashAnalytics } from "../modules/crhelper/CrashAnalyticsGenerator";
import {
  analyzeCrashReport,
  CrashReportMap,
} from "../modules/crhelper/CrashLoader";
import { CMC_CRASH_LOADER } from "../modules/crhelper/CutieMCCrashLoader";
import { LaunchTracker } from "../modules/launch/Tracker";
import { ProfileType, whatProfile } from "../modules/profile/WhatProfile";
import { submitError } from "./Message";
import {
  LAST_FAILURE_INFO_KEY,
  LAST_LAUNCH_REPORT_KEY,
  LAST_LOGS_KEY,
  MCFailureInfo,
} from "./ReadyToLaunch";
import { ALICORN_DEFAULT_THEME_LIGHT } from "./Renderer";
import { tr } from "./Translator";

const useAccStyles = makeStyles((theme) =>
  createStyles({
    root: {},
    acc1: {
      backgroundColor: theme.palette.primary.main,
    },
    acc2: {
      backgroundColor: theme.palette.primary.dark,
    },
    table: {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.primary.main,
    },
    btn: {
      color: theme.palette.primary.light,
      borderColor: theme.palette.primary.light,
    },
  })
);

export function CrashReportDisplay(): JSX.Element {
  // @ts-ignore
  const failureInfo = window[LAST_FAILURE_INFO_KEY] as MCFailureInfo;
  // @ts-ignore
  const launchTracker = window[LAST_LAUNCH_REPORT_KEY] as LaunchTracker;
  // @ts-ignore
  const logs = window[LAST_LOGS_KEY] as string[];
  const [report, setReport] = useState<CrashReportMap>();
  const [logsReport, setLogsReport] = useState<CrashReportMap>(new Map());
  const [oc, setOC] = useState<string>("");
  const mounted = useRef<boolean>(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  });
  useEffect(() => {
    if (failureInfo.crashReport !== undefined) {
      const f = failureInfo.crashReport;
      void (async () => {
        const pt = failureInfo.container.getCrashReport(f);
        const r = await analyzeCrashReport(pt);
        try {
          const dt = (await fs.readFile(pt)).toString();
          if (mounted.current) {
            setOC(dt);
          }
        } catch {}
        if (mounted.current) {
          setReport(r);
        }
      })();
    }
    if (logs.length > 0) {
      void (async () => {
        try {
          const ac = await analyzeCrashReport(
            "",
            CMC_CRASH_LOADER,
            logs.join("\n")
          );
          if (mounted.current) {
            setLogsReport(ac);
          }
        } catch {}
      })();
    }
  }, []);
  return (
    <Box>
      <BBCodeDisplay
        crashAnalytics={report}
        originCrashReport={oc}
        failureInfo={failureInfo}
        tracker={launchTracker}
        logs={logs.join("\n")}
        logsReport={logsReport}
      />
      <br />
      {
        // @ts-ignore
        window[LAST_FAILURE_INFO_KEY] === undefined ? (
          ""
        ) : (
          <BaseInfoDisplay info={failureInfo} />
        )
      }
      {
        // @ts-ignore
        window[LAST_LAUNCH_REPORT_KEY] === undefined ? (
          ""
        ) : (
          <Box>
            <ModList tracker={launchTracker} />
            <LaunchTrackCount tracker={launchTracker} />
          </Box>
        )
      }

      {report === undefined ? (
        ""
      ) : (
        <Box>
          <Analyze analyze={report} title={tr("CrashReportDisplay.Analyze")} />
          <LogsDisplay
            title={tr("CrashReportDisplay.CrashReport")}
            logs={oc.split("\n")}
          />
        </Box>
      )}
      {
        // @ts-ignore
        window[LAST_LOGS_KEY]?.length === 0 ? (
          ""
        ) : (
          <Box>
            <Analyze
              analyze={logsReport}
              title={tr("CrashReportDisplay.AnalyzeLogs")}
            />
            <LogsDisplay title={tr("CrashReportDisplay.Logs")} logs={logs} />
          </Box>
        )
      }
    </Box>
  );
}

function BaseInfoDisplay(props: { info: MCFailureInfo }): JSX.Element {
  const classes = useAccStyles();
  return (
    <Accordion>
      <AccordionSummary className={classes.acc1} expandIcon={<ExpandMore />}>
        <Typography>{tr("CrashReportDisplay.BaseInfo")}</Typography>
      </AccordionSummary>
      <AccordionDetails className={classes.acc1}>
        <Table className={classes.table}>
          <TableBody>
            <TableRow>
              <TableCell>{tr("CrashReportDisplay.BaseInfo.ID")}</TableCell>
              <TableCell>{props.info.profile.id}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                {tr("CrashReportDisplay.BaseInfo.BaseVersion")}
              </TableCell>
              <TableCell>{props.info.profile.baseVersion}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{tr("CrashReportDisplay.BaseInfo.Modded")}</TableCell>
              <TableCell>
                {(() => {
                  const type = whatProfile(props.info.profile.id);
                  if (type === ProfileType.MOJANG) {
                    return tr("CrashReportDisplay.BaseInfo.Modded.No");
                  }
                  if (type === ProfileType.UNIVERSAL) {
                    return tr("CrashReportDisplay.BaseInfo.Modded.Unknown");
                  }
                  return tr("CrashReportDisplay.BaseInfo.Modded.Yes");
                })()}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                {tr("CrashReportDisplay.BaseInfo.AssetIndex")}
              </TableCell>
              <TableCell>{props.info.profile.assetIndex.id}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{tr("CrashReportDisplay.BaseInfo.Time")}</TableCell>
              <TableCell>
                {props.info.profile.releaseTime.toLocaleString()}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </AccordionDetails>
    </Accordion>
  );
}

function LaunchTrackCount(props: { tracker: LaunchTracker }): JSX.Element {
  const classes = useAccStyles();
  return (
    <Accordion className={classes.root}>
      <AccordionSummary className={classes.acc1} expandIcon={<ExpandMore />}>
        <Typography>{tr("CrashReportDisplay.LaunchTrackCount")}</Typography>
      </AccordionSummary>
      <AccordionDetails className={classes.acc1}>
        <Table className={classes.table}>
          <TableBody>
            <TableRow>
              <TableCell>{tr("CrashReportDisplay.Libraries")}</TableCell>
              <TableCell>
                {`${props.tracker.library().resolved} ${tr(
                  "CrashReportDisplay.Resolved"
                )} / ${props.tracker.library().total} ${tr(
                  "CrashReportDisplay.Total"
                )}`}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>{tr("CrashReportDisplay.Assets")}</TableCell>
              <TableCell>
                {`${props.tracker.assets().resolved} ${tr(
                  "CrashReportDisplay.Resolved"
                )} / ${props.tracker.assets().total} ${tr(
                  "CrashReportDisplay.Total"
                )}`}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </AccordionDetails>
    </Accordion>
  );
}

function ModList(props: { tracker: LaunchTracker }): JSX.Element {
  const classes = useAccStyles();
  return props.tracker.mods().total > 0 ? (
    <Accordion>
      <AccordionSummary className={classes.acc1} expandIcon={<ExpandMore />}>
        <Typography>{tr("CrashReportDisplay.Mods")}</Typography>
      </AccordionSummary>
      <AccordionDetails className={classes.acc1}>
        <Table className={classes.table}>
          <TableBody>
            {props.tracker.mods().operateRecord.map((o) => {
              return (
                <TableRow key={o.file}>
                  <TableCell>{o.file}</TableCell>
                  <TableCell>
                    {o.operation === "OPERATED"
                      ? tr("CrashReportDisplay.Mods.Moved")
                      : o.operation === "SKIPPED"
                      ? tr("CrashReportDisplay.Mods.Reserved")
                      : tr("CrashReportDisplay.Mods.Failed")}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AccordionDetails>
    </Accordion>
  ) : (
    <></>
  );
}

function Analyze(props: {
  analyze: CrashReportMap;
  title: string;
}): JSX.Element {
  const classes = useAccStyles();
  const analyzeList = Array.from(props.analyze.keys());
  let total = 0;
  for (const a of analyzeList) {
    const c = props.analyze.get(a)?.report;
    if (c && c.length > 0) {
      total += c.length;
    }
  }
  return (
    <Accordion>
      <AccordionSummary className={classes.acc1} expandIcon={<ExpandMore />}>
        <Badge badgeContent={total.toString()} color={"secondary"}>
          <Typography>{props.title}</Typography>
        </Badge>
      </AccordionSummary>
      <AccordionDetails className={classes.acc1}>
        <List>
          {(() => {
            const li = analyzeList;
            return li.map((n) => {
              const cr = props.analyze.get(n);
              if (cr?.report.length === 0) {
                return "";
              }
              return (
                <ListItem key={n}>
                  <Accordion>
                    <AccordionSummary
                      className={classes.acc2}
                      expandIcon={<ExpandMore />}
                    >
                      <Typography>
                        {tr(
                          "CrashReportDisplay.Analyze.Line",
                          `Line=${n}`,
                          `Content=${cr?.origin}`
                        )}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails className={classes.acc2}>
                      <List>
                        {cr?.report.map((r) => {
                          if (r.by === undefined || r.reason === undefined) {
                            return <></>;
                          }
                          return (
                            <ListItem key={r.by + r.reason}>
                              <Accordion>
                                <AccordionSummary
                                  className={classes.acc1}
                                  expandIcon={
                                    r.suggestions !== undefined &&
                                    r.suggestions.length > 0 ? (
                                      <ExpandMore />
                                    ) : undefined
                                  }
                                >
                                  <Typography>{`${r.by} ${r.reason}`}</Typography>
                                </AccordionSummary>
                                <AccordionDetails className={classes.acc1}>
                                  {r.suggestions === undefined ||
                                  r.suggestions.length === 0 ? (
                                    ""
                                  ) : (
                                    <List>
                                      {r.suggestions.map((s) => {
                                        return (
                                          <ListItem key={s}>
                                            <ListItemText>{s}</ListItemText>
                                          </ListItem>
                                        );
                                      })}
                                    </List>
                                  )}
                                </AccordionDetails>
                              </Accordion>
                            </ListItem>
                          );
                        })}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                </ListItem>
              );
            });
          })()}
        </List>
      </AccordionDetails>
    </Accordion>
  );
}

function LogsDisplay(props: { logs: string[]; title: string }): JSX.Element {
  const classes = useAccStyles();
  const cLogs = props.logs.join("\n").split("\n");
  return (
    <Accordion>
      <AccordionSummary className={classes.acc1} expandIcon={<ExpandMore />}>
        <Typography>{props.title}</Typography>
      </AccordionSummary>
      <AccordionDetails className={classes.acc1}>
        <List>
          {cLogs.map((l, i) => {
            if (l.trim().length === 0) {
              return "";
            }
            return (
              <ListItemText
                style={{
                  wordBreak: "break-all",
                  color:
                    l.includes("ERROR") || l.includes("FATAL")
                      ? "#ff0000"
                      : l.includes("WARN")
                      ? "#ff8400"
                      : "gray",
                  backgroundColor:
                    l.includes("ERROR") || l.includes("FATAL")
                      ? "white"
                      : "inherit",
                }}
                key={i}
              >
                {l}
              </ListItemText>
            );
          })}
        </List>
      </AccordionDetails>
    </Accordion>
  );
}

function BBCodeDisplay(props: {
  crashAnalytics?: CrashReportMap;
  originCrashReport: string;
  failureInfo: MCFailureInfo;
  tracker: LaunchTracker;
  logs: string;
  logsReport?: CrashReportMap;
}): JSX.Element {
  const classes = useAccStyles();
  const code = generateCrashAnalytics(
    props.crashAnalytics,
    props.originCrashReport,
    props.tracker,
    props.logs,
    props.logsReport
  );
  return (
    <Box
      style={{
        display: "flex",
      }}
    >
      <Typography
        style={{
          display: "inline",
          fontSize: window.sessionStorage.getItem("smallFontSize") || "16px",
          overflow: "auto",
          lineBreak: "auto",
        }}
        color={"secondary"}
      >
        {tr("CrashReportDisplay.Instruction")}
      </Typography>
      <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
        <Button
          onClick={() => {
            if (!copy(code, { format: "text/plain" })) {
              submitError("Failed to copy!");
            }
          }}
          style={{
            display: "inline",
            float: "right",
            marginLeft: "auto",
            width: "15%",
          }}
          variant={"outlined"}
          className={classes.btn}
        >
          {tr("CrashReportDisplay.Copy")}
        </Button>
      </MuiThemeProvider>
    </Box>
  );
}
