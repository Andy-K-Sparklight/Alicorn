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
import { getNumber, getString } from "../../modules/config/ConfigSupport";
import {
  ExtraAddonInfo,
  moreAddonInfoBySlug,
} from "../../modules/pff/curseforge/Get";
import { CF_API_BASE_URL } from "../../modules/pff/curseforge/Values";
import { submitInfo, submitWarn } from "../Message";
import { ALICORN_DEFAULT_THEME_LIGHT } from "../Renderer";
import { fullWidth, useCardStyles, usePadStyles } from "../Stylex";
import { tr } from "../Translator";

export function PffVisual(): JSX.Element {
  const [slug, setSlug] = useState("");
  const [searchResults, setResults] = useState<ExtraAddonInfo[]>([]);
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
                          void (async () => {
                            let apiBase = getString(
                              "pff.api-base",
                              CF_API_BASE_URL
                            );
                            apiBase = apiBase.endsWith("/")
                              ? apiBase.slice(0, -1)
                              : apiBase;
                            const pageSize =
                              getNumber("pff.page-size", 10) || 10;

                            const timeout = getNumber(
                              "download.concurrent.timeout"
                            );
                            const a = await moreAddonInfoBySlug(
                              slug,
                              apiBase,
                              "",
                              pageSize,
                              timeout
                            );
                            if (mounted.current) {
                              setResults(a);
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
          return <SingleAddonDisplay key={s.id} info={s}></SingleAddonDisplay>;
        })}
      </Box>
    </Box>
  );
}

function SingleAddonDisplay(props: { info: ExtraAddonInfo }): JSX.Element {
  const classes = useCardStyles();
  const a: string[] = [];
  props.info.gameVersionLatestFiles.forEach((f) => {
    const ml = f.modLoader === 4 ? "(Fb)" : f.modLoader === 1 ? "(Fg)" : "";
    if (!a.includes(f.gameVersion + ml)) {
      a.push(f.gameVersion + ml);
    }
  });
  return (
    <Box style={{ textAlign: "left" }}>
      <Card
        className={props.info.type === "MOD" ? classes.card : classes.card2}
        onClick={() => {
          if (props.info.type === "MOD") {
            if (copy(props.info.slug)) {
              submitInfo(tr("Utilities.PffVisual.Copied"));
            } else {
              submitWarn("Utilities.PffVisual.CouldNotCopy");
            }
          } else if (props.info.type === "MODPACK") {
            if (props.info.url && copy(props.info.url)) {
              submitInfo(tr("Utilities.PffVisual.CopiedUrl"));
            } else {
              submitWarn("Utilities.PffVisual.CouldNotCopy");
            }
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
              {`${props.info.slug} (${props.info.id})`}
            </Typography>
            <Typography variant={"h6"}>{props.info.name}</Typography>
            <br />
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
