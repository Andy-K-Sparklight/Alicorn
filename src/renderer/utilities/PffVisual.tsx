import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  IconButton,
  InputAdornment,
  MuiThemeProvider,
  TextField,
  Typography,
} from "@material-ui/core";
import { Search } from "@material-ui/icons";
import copy from "copy-to-clipboard";
import React, { useEffect, useRef, useState } from "react";
import { getNumber } from "../../modules/config/ConfigSupport";
import { ModMeta } from "../../modules/pff/virtual/ModDefine";
import { getResolvers } from "../../modules/pff/virtual/PffWrapper";
import { submitInfo, submitWarn } from "../Message";
import { ALICORN_DEFAULT_THEME_LIGHT } from "../Renderer";
import { fullWidth, useCardStyles, usePadStyles } from "../Stylex";
import { tr } from "../Translator";

export function PffVisual(): JSX.Element {
  const [slug, setSlug] = useState("");
  const [searchResults, setResults] = useState<ModMeta[]>([]);
  const [searching, setSearching] = useState(false);
  const fullWidthClasses = fullWidth();
  const classes = usePadStyles();
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  });
  return (
    <Box>
      <Typography
        color={"secondary"}
        style={{ marginLeft: 0 }}
        className={classes.smallText}
      >
        {tr("Utilities.PffVisual.Hint")}
      </Typography>
      <Box className={classes.para}>
        <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
          <Box>
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
                          setResults([]);
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
                              setResults(o);
                              setSearching(false);
                            }
                          })();
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
          </Box>
        </MuiThemeProvider>
        <br />
        <br />
        {searchResults.map((s) => {
          return <SingleAddonDisplay key={s.id} info={s} />;
        })}
      </Box>
    </Box>
  );
}

function SingleAddonDisplay(props: { info: ModMeta }): JSX.Element {
  const classes = useCardStyles();
  const a = props.info.supportVersions;
  return (
    <Box style={{ textAlign: "left" }}>
      <Card
        className={classes.card}
        onClick={() => {
          if (copy("@" + props.info.provider + ":" + props.info.id)) {
            submitInfo(tr("Utilities.PffVisual.Copied"));
          } else {
            submitWarn("Utilities.PffVisual.CouldNotCopy");
          }
        }}
      >
        <CardContent>
          <img
            className={classes.operateButton}
            src={props.info.thumbNail}
            alt={"LOGO"}
            height={48}
            width={48}
          />
          <Box>
            <Typography className={classes.text} color={"textSecondary"}>
              {props.info.id}
            </Typography>
            <Typography variant={"h6"}>{props.info.displayName}</Typography>
            <br />
            <Typography
              className={classes.text}
              style={{
                fontSize:
                  window.sessionStorage.getItem("smallFontSize") || "16px",
              }}
              color={"textSecondary"}
            >
              {tr(
                "Utilities.PffVisual.Provider",
                `Name=${props.info.provider}`
              )}
            </Typography>
            <Typography
              className={classes.text}
              style={{
                fontSize:
                  window.sessionStorage.getItem("smallFontSize") || "16px",
              }}
              color={"textSecondary"}
            >
              {tr("Utilities.PffVisual.VersionRange") + a.join(" ")}
            </Typography>
          </Box>
        </CardContent>
      </Card>
      <br />
    </Box>
  );
}
