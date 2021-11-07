import { Search } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  ThemeProvider,
  Typography,
} from "@mui/material";
import copy from "copy-to-clipboard";
import React, { useEffect, useRef, useState } from "react";
import { getNumber } from "../../modules/config/ConfigSupport";
import {
  ExtraAddonInfo,
  moreAddonInfoBySlug,
} from "../../modules/pff/curseforge/Get";
import { ModMeta } from "../../modules/pff/virtual/ModDefine";
import { getResolvers } from "../../modules/pff/virtual/PffWrapper";
import { jumpTo, triggerSetPage } from "../GoTo";
import { submitInfo, submitSucc, submitWarn } from "../Message";
import { ALICORN_DEFAULT_THEME_LIGHT } from "../Renderer";
import { fullWidth, useCardStyles, usePadStyles } from "../Stylex";
import { tr } from "../Translator";

export function PffVisual(): JSX.Element {
  const [slug, setSlug] = useState("");
  const [modSearchResults, setModResults] = useState<ModMeta[]>([]);
  const [modpackSearchResults, setModpackSearchResults] = useState<
    ExtraAddonInfo[]
  >([]);
  const [searching, setSearching] = useState(false);
  const fullWidthClasses = fullWidth();
  const classes = usePadStyles();
  const mounted = useRef(false);
  const [multiSelect, setMultiSelect] = useState(false);
  const [selections, setSelections] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"Normal" | "Modpack">("Normal");
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  });
  return (
    <>
      <Typography
        color={"secondary"}
        style={{ marginLeft: 0 }}
        className={classes.smallText}
      >
        {tr("Utilities.PffVisual.Hint")}
      </Typography>
      <Box className={classes.para}>
        <ThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
          <>
            <FormControl>
              <TextField
                spellCheck={false}
                className={fullWidthClasses.form}
                color={"primary"}
                value={slug}
                disabled={searching}
                placeholder={tr("Utilities.PffVisual.Slug")}
                onChange={(e) => {
                  setSlug(e.target.value);
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position={"end"}>
                      <IconButton
                        disabled={searching || slug.trim().length === 0}
                        color={"primary"}
                        onClick={() => {
                          setSearching(true);
                          setModResults([]);
                          setModpackSearchResults([]);
                          if (mode === "Normal") {
                            void (async () => {
                              const rsvs = getResolvers(slug);
                              const rets = await Promise.allSettled(
                                rsvs.map((r) => {
                                  return r.searchMods(
                                    getNumber("pff.page-size", 20)
                                  );
                                })
                              );
                              let o: ModMeta[] = [];
                              rets.forEach((r) => {
                                if (r.status === "fulfilled") {
                                  o = o.concat(r.value);
                                }
                              });
                              if (mounted.current) {
                                setModResults(o);
                                setSearching(false);
                              }
                            })();
                          }
                          if (mode === "Modpack") {
                            void (async () => {
                              try {
                                const r = await moreAddonInfoBySlug(
                                  slug,
                                  "https://addons-ecs.forgesvc.net",
                                  "",
                                  getNumber("pff.page-size"),
                                  getNumber("download.pff.timeout")
                                );
                                if (mounted.current) {
                                  setModpackSearchResults(r);
                                }
                              } catch {}
                              if (mounted.current) {
                                setSearching(false);
                              }
                            })();
                          }
                        }}
                      >
                        {searching ? (
                          <CircularProgress size={"1.5rem"} />
                        ) : (
                          <Search />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>
            <br />
          </>
          <FormControlLabel
            control={
              <Checkbox
                checked={multiSelect}
                disabled={mode !== "Normal"}
                onChange={(e) => {
                  setMultiSelect(e.target.checked);
                  if (!e.target.checked) {
                    if (selections.size > 0) {
                      const s = Array.from(selections).join(" ");
                      if (copy(s, { format: "text/plain" })) {
                        submitSucc(tr("Utilities.PffVisual.Copied"));
                      } else {
                        submitWarn("Utilities.PffVisual.CouldNotCopy");
                      }
                      setSelections(new Set());
                      setSelectedIds(new Set());
                    }
                  }
                }}
              />
            }
            label={tr("Utilities.PffVisual.MultiSelect")}
          />
          <FormControlLabel
            control={
              <Checkbox
                disabled={searching}
                checked={mode === "Modpack"}
                onChange={(e) => {
                  if (e.target.checked) {
                    setMode("Modpack");
                    setMultiSelect(false);
                  } else {
                    setMode("Normal");
                  }
                }}
              />
            }
            label={tr("Utilities.PffVisual.Modpack")}
          />
        </ThemeProvider>

        <br />
        {mode === "Normal"
          ? modSearchResults.map((s) => {
              return (
                <SingleAddonDisplay
                  key={s.id}
                  info={s}
                  isSelected={selectedIds.has(s.id)}
                  multiSelect={multiSelect}
                  onSelect={(x) => {
                    if (selections.has(x)) {
                      const s = new Set(selections);
                      s.delete(x);
                      setSelections(s);
                    } else {
                      const s = new Set(selections);
                      s.add(x);
                      setSelections(s);
                    }
                    if (selectedIds.has(s.id)) {
                      const si = new Set(selectedIds);
                      si.delete(s.id);
                      setSelectedIds(si);
                    } else {
                      const si = new Set(selectedIds);
                      si.add(s.id);
                      setSelectedIds(si);
                    }
                  }}
                />
              );
            })
          : modpackSearchResults.map((s) => {
              if (s.type !== "MODPACK") {
                return "";
              }
              return (
                <SingleAddonDisplay
                  onSelect={() => {}}
                  modpack={s}
                  key={s.id}
                  multiSelect={false}
                  isSelected={false}
                />
              );
            })}
      </Box>
    </>
  );
}

function SingleAddonDisplay(props: {
  info?: ModMeta;
  modpack?: ExtraAddonInfo;
  multiSelect: boolean;
  isSelected: boolean;
  onSelect: (s: string) => unknown;
}): JSX.Element {
  const classes = useCardStyles();
  const a = props.info?.supportVersions || [];
  return (
    <Box style={{ textAlign: "left" }}>
      <Card
        raised={true}
        className={props.isSelected ? classes.card2 : classes.card}
        onClick={() => {
          if (props.info) {
            const installName = "@" + props.info.provider + ":" + props.info.id;
            if (!props.multiSelect) {
              if (copy(installName)) {
                submitInfo(tr("Utilities.PffVisual.Copied"));
              } else {
                submitWarn("Utilities.PffVisual.CouldNotCopy");
              }
            } else {
              props.onSelect(installName);
            }
          } else if (props.modpack) {
            jumpTo(
              "/ContainerManager/" + encodeURIComponent(props.modpack.url)
            );
            triggerSetPage("ContainerManager");
          }
        }}
      >
        <CardContent>
          <img
            className={classes.operateButton}
            src={props.info?.thumbNail || props.modpack?.thumbNail}
            alt={"LOGO"}
            height={48}
            width={48}
          />
          <>
            <Typography className={classes.text} color={"textSecondary"}>
              {props.info?.id || props.modpack?.id}
            </Typography>
            <Typography variant={"h6"}>
              {props.info?.displayName || props.modpack?.name}
            </Typography>
            <br />
            <Typography
              className={classes.text + " smtxt"}
              color={"textSecondary"}
            >
              {tr(
                "Utilities.PffVisual.Provider",
                `Name=${props.info?.provider || "Curseforge"}`
              )}
            </Typography>
            {props.info ? (
              <Typography
                className={classes.text + " smtxt"}
                color={"textSecondary"}
              >
                {tr("Utilities.PffVisual.VersionRange") + a.join(" ")}
              </Typography>
            ) : (
              ""
            )}
          </>
        </CardContent>
      </Card>
      <br />
    </Box>
  );
}
