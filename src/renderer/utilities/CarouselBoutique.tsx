import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  List,
  ListItem,
  MuiThemeProvider,
  Radio,
  RadioGroup,
  Snackbar,
  TextField,
  Typography,
} from "@material-ui/core";
import { ipcRenderer } from "electron";
import React, { useEffect, useState } from "react";
import { LocalAccount } from "../../modules/auth/LocalAccount";
import { Pair } from "../../modules/commons/Collections";
import { ALICORN_SEPARATOR } from "../../modules/commons/Constants";
import {
  configureSkin,
  removeSkin,
  skinTypeFor,
} from "../../modules/localskin/LocalYggdrasilServer";
import { ALICORN_DEFAULT_THEME_LIGHT } from "../Renderer";
import { useTextStyles } from "../Stylex";
import { tr } from "../Translator";

const ALL_SET_ACCOUNTS_KEY = "Utilities.CarouselBoutique.AllAccounts";
export function CarouselBoutique(): JSX.Element {
  const [names, setNames] = useState<Pair<string, "DEFAULT" | "SLIM">[]>([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isSlim, setIsSlim] = useState(false);
  const [openSnack, setOpenSnack] = useState(false);
  useEffect(() => {
    const allAc = (
      window.localStorage.getItem(ALL_SET_ACCOUNTS_KEY) || ""
    ).split(ALICORN_SEPARATOR);
    const oc: Pair<string, "DEFAULT" | "SLIM">[] = [];
    void Promise.all(
      allAc.map(async (a) => {
        const la = new LocalAccount(a);
        const s = await skinTypeFor(la);
        if (s !== "NONE") {
          oc.push(new Pair(a, s));
        }
      })
    ).then(() => {
      setNames(oc);
    });
  }, []);
  const classes = useTextStyles();
  return (
    <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
      <Box>
        <Snackbar
          open={openSnack}
          onClose={() => {
            setOpenSnack(false);
          }}
          message={tr("Utilities.CarouselBoutique.SetSuccessful")}
          autoHideDuration={5000}
        />
        <Typography className={classes.secondText}>
          {tr("Utilities.CarouselBoutique.Hint")}
        </Typography>
        <List>
          {names.map((n) => {
            return (
              <ListItem
                key={n.getFirstValue()}
                onClick={() => {
                  setPlayerName(n.getFirstValue());
                }}
              >
                <Typography>{n.getFirstValue()}</Typography>
              </ListItem>
            );
          })}
        </List>
        <br />
        <FormControl>
          <TextField
            color={"primary"}
            variant={"outlined"}
            style={{
              float: "left",
            }}
            onChange={(e) => {
              setPlayerName(e.target.value);
            }}
            spellCheck={false}
            margin={"dense"}
            value={playerName}
            label={tr("Utilities.CarouselBoutique.PlayerName")}
          />
          <br />
          <Button
            color={"primary"}
            type={"button"}
            variant={"contained"}
            onClick={async () => {
              const d = await remoteSelectPng();
              setSelectedFile(d);
            }}
          >
            {tr("Utilities.CarouselBoutique.FileName")}
          </Button>
          <Typography className={classes.secondText}>{selectedFile}</Typography>
          <br />
          <RadioGroup
            row
            onChange={(e) => {
              switch (e.target.value) {
                case "Default":
                  setIsSlim(false);
                  break;
                case "Slim":
                  setIsSlim(true);
              }
            }}
          >
            <FormControlLabel
              value={"Default"}
              control={<Radio checked={!isSlim} />}
              label={tr("Utilities.CarouselBoutique.Model.Default")}
            />
            <FormControlLabel
              value={"Slim"}
              control={<Radio checked={isSlim} />}
              label={tr("Utilities.CarouselBoutique.Model.Alex")}
            />
          </RadioGroup>
        </FormControl>
        <br />
        <Button
          disabled={
            playerName.trim().length === 0 || selectedFile.trim().length === 0
          }
          color={"primary"}
          variant={"contained"}
          onClick={async () => {
            await configureSkin(
              playerName,
              selectedFile,
              isSlim ? "SLIM" : "DEFAULT",
              "-"
            );
            setOpenSnack(true);
            const n = names.concat([
              new Pair(playerName, isSlim ? "SLIM" : "DEFAULT"),
            ]);
            setNames(n);
            window.localStorage.setItem(
              ALL_SET_ACCOUNTS_KEY,
              n
                .map((s) => {
                  return s.getFirstValue();
                })
                .join(ALICORN_SEPARATOR)
            );
          }}
        >
          {tr("Utilities.CarouselBoutique.AddAsSkin")}
        </Button>
        <Button
          disabled={
            playerName.trim().length === 0 || selectedFile.trim().length === 0
          }
          style={{ marginLeft: "4px" }}
          color={"primary"}
          variant={"contained"}
          onClick={async () => {
            await configureSkin(
              playerName,
              selectedFile,
              isSlim ? "SLIM" : "DEFAULT",
              "-CAPE-"
            );
            setOpenSnack(true);
          }}
        >
          {tr("Utilities.CarouselBoutique.AddAsCape")}
        </Button>
        <Button
          disabled={playerName.trim().length === 0}
          style={{ marginLeft: "4px" }}
          color={"primary"}
          variant={"contained"}
          onClick={async () => {
            await removeSkin(playerName, "-");
            const n = names.concat();
            let ix = -1;
            n.forEach((n, i) => {
              if (n.getFirstValue() === playerName) {
                ix = i;
              }
            });
            if (ix >= 0) {
              n.splice(ix, 1);
            }
            setNames(n);
            window.localStorage.setItem(
              ALL_SET_ACCOUNTS_KEY,
              n
                .map((s) => {
                  return s.getFirstValue();
                })
                .join(ALICORN_SEPARATOR)
            );
          }}
        >
          {tr("Utilities.CarouselBoutique.RemoveSkin")}
        </Button>
        <Button
          disabled={playerName.trim().length === 0}
          style={{ marginLeft: "4px" }}
          color={"primary"}
          variant={"contained"}
          onClick={async () => {
            await removeSkin(playerName, "-CAPE-");
          }}
        >
          {tr("Utilities.CarouselBoutique.RemoveCape")}
        </Button>
      </Box>
    </MuiThemeProvider>
  );
}

async function remoteSelectPng(): Promise<string> {
  return String((await ipcRenderer.invoke("selectPng")) || "");
}
