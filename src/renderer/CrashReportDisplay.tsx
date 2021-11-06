import { ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Box,
  Button,
  FormControl,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableRow,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import copy from "copy-to-clipboard";
import React, { useEffect, useRef, useState } from "react";
import { generateCrashAnalytics } from "../modules/crhelper/CrashAnalyticsGenerator";
import {
  analyzeCrashReport,
  CrashReportMap,
} from "../modules/crhelper/CrashLoader";
import { LaunchTracker } from "../modules/launch/Tracker";
import { ProfileType, whatProfile } from "../modules/profile/WhatProfile";
import { submitSucc, submitWarn } from "./Message";
import {
  LAST_CRASH_KEY,
  LAST_FAILURE_INFO_KEY,
  LAST_LAUNCH_REPORT_KEY,
  LAST_LOGS_KEY,
  MCFailureInfo,
} from "./ReadyToLaunch";
import {
  ALICORN_DEFAULT_THEME_DARK,
  ALICORN_DEFAULT_THEME_LIGHT,
} from "./Renderer";
import { AlicornTheme } from "./Stylex";
import { tr } from "./Translator";

const useAccStyles = makeStyles((theme: AlicornTheme) => ({
  root: {},
  acc1: {
    backgroundColor: theme.palette.primary.main,
  },
  acc2: {
    backgroundColor: theme.palette.primary.dark,
  },
  table: {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.main,
  },
  btn: {
    color: theme.palette.primary.light,
    borderColor: theme.palette.primary.light,
  },
}));

export function CrashReportDisplay(): JSX.Element {
  // @ts-ignore
  const failureInfo = window[LAST_FAILURE_INFO_KEY] as MCFailureInfo;
  // @ts-ignore
  const launchTracker = window[LAST_LAUNCH_REPORT_KEY] as LaunchTracker;
  // @ts-ignore
  const logs = window[LAST_LOGS_KEY] as string[];
  const [report, setReport] = useState<CrashReportMap>();
  const [logsReport, setLogsReport] = useState<CrashReportMap>(new Map());
  const [oc, setOC] = useState<string[]>([]);
  const [showFullLogsReport, setShowFullLogsReport] = useState(false);
  useEffect(() => {
    window.addEventListener("EnableShowFullLogsReport", () => {
      setShowFullLogsReport(true);
    });
  }, []);
  const mounted = useRef<boolean>(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  });
  useEffect(() => {
    // @ts-ignore
    if (window[LAST_CRASH_KEY] !== undefined) {
      // @ts-ignore
      const crashReports = window[LAST_CRASH_KEY] as string[];
      void (async () => {
        const r = await analyzeCrashReport(crashReports);
        try {
          if (mounted.current) {
            setOC(crashReports);
          }
        } catch {}
        if (mounted.current) {
          setReport(r);
        }
      })();
    }
    if (logs.length > 0) {
      let s = 0;
      const e = logs.length - 1;
      if (!showFullLogsReport) {
        s = e - LOGS_BUFFER_SIZE;
        if (s < 0) {
          setShowFullLogsReport(true);
          s = 0;
        }
      }
      const ls = logs.slice(s, e);
      void (async () => {
        try {
          const ac = await analyzeCrashReport(ls);
          if (mounted.current) {
            setLogsReport(ac);
          }
        } catch {}
      })();
    }
  }, []);
  return (
    <>
      <BBCodeDisplay
        crashAnalytics={report}
        originCrashReport={oc}
        failureInfo={failureInfo}
        tracker={launchTracker}
        logs={logs}
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
          <>
            <ModList tracker={launchTracker} />
            <LaunchTrackCount tracker={launchTracker} />
          </>
        )
      }

      {report === undefined ? (
        ""
      ) : (
        <>
          <Analyze
            analyze={report}
            isFull
            title={tr("CrashReportDisplay.Analyze")}
          />
          <LogsDisplay title={tr("CrashReportDisplay.CrashReport")} logs={oc} />
        </>
      )}
      {
        // @ts-ignore
        window[LAST_LOGS_KEY]?.length === 0 ? (
          ""
        ) : (
          <>
            <Analyze
              isFull={showFullLogsReport}
              analyze={logsReport}
              title={tr("CrashReportDisplay.AnalyzeLogs")}
            />
            <LogsDisplay title={tr("CrashReportDisplay.Logs")} logs={logs} />
          </>
        )
      }
    </>
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
  isFull: boolean;
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
        {props.isFull ? (
          ""
        ) : (
          <>
            <Typography
              style={{
                color: ALICORN_DEFAULT_THEME_DARK.palette.secondary.light,
              }}
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("EnableShowFullLogsReport")
                );
              }}
            >
              {tr("CrashReportDisplay.AnalyzeLogs.PerformanceIssue")}
            </Typography>
            <br />
            <br />
          </>
        )}
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

function isWarn(s: string): boolean {
  return WARN_LN_REGEX.test(s);
}
function isException(s: string): boolean {
  return ERR_LN_REGEX.test(s) || EXCEPTION_LN_REGEX.test(s);
}
const EXCEPTION_LN_REGEX = /^([0-9A-Za-z_]+\.)+?.+?(Exception|Error).+?:/i;
const ERR_LN_REGEX = /(error|fatal|caused by)/i;
const WARN_LN_REGEX = /warn/i;
const LOGS_BUFFER_SIZE = 100;
function LogsDisplay(props: { logs: string[]; title: string }): JSX.Element {
  const classes = useAccStyles();
  const cLogs = props.logs.join("\n").split("\n");
  const [cIndex, setcIndex] = useState(0); // Reversed, form the last line, offset up, 0: -100 ~ end, 1: -101 ~ -1
  const endIndex = cLogs.length - cIndex - 1;
  let startIndex = endIndex - LOGS_BUFFER_SIZE;
  if (startIndex < 0) {
    startIndex = 0;
  }
  const oLogs = cLogs.slice(startIndex, endIndex + 1);
  return (
    <Accordion>
      <AccordionSummary className={classes.acc1} expandIcon={<ExpandMore />}>
        <Typography>{props.title}</Typography>
      </AccordionSummary>
      <AccordionDetails className={classes.acc1}>
        <List>
          {startIndex > 0 ? (
            <Box
              onClick={() => {
                let x = cIndex + LOGS_BUFFER_SIZE / 2;
                if (x > cLogs.length - LOGS_BUFFER_SIZE - 1) {
                  x = cLogs.length - LOGS_BUFFER_SIZE - 1;
                }
                setcIndex(x);
              }}
            >
              <ListItemText
                style={{
                  color: ALICORN_DEFAULT_THEME_DARK.palette.secondary.light,
                }}
              >
                <b>{tr("CrashReportDisplay.AnalyzeLogs.Up")}</b>
              </ListItemText>
              <hr />
            </Box>
          ) : (
            ""
          )}
          {oLogs.map((l, i) => {
            if (l.trim().length === 0) {
              return "";
            }
            return (
              <Typography
                key={i}
                style={{
                  wordBreak: "break-all",
                  color: isException(l)
                    ? "#ff0000"
                    : isWarn(l)
                    ? "#ff8400"
                    : "gray",
                  backgroundColor: isException(l) ? "white" : "inherit",
                }}
                dangerouslySetInnerHTML={{ __html: tab2Space(l) }}
              />
            );
          })}
          {endIndex < cLogs.length - 1 ? (
            <Box
              onClick={() => {
                let x = cIndex - LOGS_BUFFER_SIZE / 2;
                if (x < 0) {
                  x = 0;
                }
                setcIndex(x);
              }}
            >
              <hr />
              <ListItemText
                style={{
                  color: ALICORN_DEFAULT_THEME_DARK.palette.secondary.light,
                }}
              >
                <b>{tr("CrashReportDisplay.AnalyzeLogs.Down")}</b>
              </ListItemText>
            </Box>
          ) : (
            ""
          )}
        </List>
      </AccordionDetails>
    </Accordion>
  );
}

function BBCodeDisplay(props: {
  crashAnalytics?: CrashReportMap;
  originCrashReport: string[];
  failureInfo: MCFailureInfo;
  tracker: LaunchTracker;
  logs: string[];
  logsReport?: CrashReportMap;
}): JSX.Element {
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
          overflow: "auto",
          lineBreak: "auto",
        }}
        className={"smtxt"}
        color={"secondary"}
      >
        {tr("CrashReportDisplay.Instruction")}
      </Typography>
      <ThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
        <FormControl style={{ display: "inline", marginLeft: "auto" }}>
          <Button
            onClick={() => {
              if (!copy(code, { format: "text/plain" })) {
                submitWarn(tr("CrashReportDisplay.FailedToCopy"));
              } else {
                submitSucc(tr("CrashReportDisplay.Copied"));
              }
            }}
            variant={"contained"}
            color={"primary"}
          >
            {tr("CrashReportDisplay.Copy")}
          </Button>
          <br />
          <br />
          <Button
            onClick={() => {
              if (
                !copy(
                  `Crash Report:\n[spoiler][code]${
                    props.originCrashReport.join("\n") ||
                    "Alicorn: Crash Report Not Found"
                  }[/code][/spoiler]\n\nLogs:\n[spoiler][code]${
                    props.logs
                      .map(tab2Space)
                      .slice(-10000) // Safe Limit
                      .join("\n") || "Alicorn: Logs Not Found"
                  }[/code][/spoiler]`,
                  { format: "text/plain" }
                )
              ) {
                submitWarn(tr("CrashReportDisplay.FailedToCopy"));
              } else {
                submitSucc(tr("CrashReportDisplay.Copied"));
              }
            }}
            variant={"contained"}
            color={"primary"}
          >
            {tr("CrashReportDisplay.CopyLogs")}
          </Button>
        </FormControl>
      </ThemeProvider>
    </Box>
  );
}

function tab2Space(s: string): string {
  let i = 0;
  let p = 0;
  const o: string[] = [];
  while (s[i] !== undefined) {
    if (s[i] !== "\t") {
      o.push(s[i]);
      p++;
    } else {
      const r = 4 - ((p + 1) % 4);
      o.push("&nbsp;".repeat(r));
      p += r;
    }
    i++;
  }
  return o
    .join("")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("\n", "<br/>");
}
