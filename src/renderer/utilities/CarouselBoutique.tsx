import {
  Button,
  FormControl,
  FormControlLabel,
  MuiThemeProvider,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@material-ui/core";
import { ipcRenderer } from "electron";
import React, { useEffect, useState } from "react";
import { LocalAccount } from "../../modules/auth/LocalAccount";
import { ALICORN_SEPARATOR } from "../../modules/commons/Constants";
import {
  configureDefaultSkin,
  configureSkin,
  removeSkin,
  skinTypeFor,
} from "../../modules/localskin/LocalYggdrasilServer";
import { submitSucc } from "../Message";
import { ALICORN_DEFAULT_THEME_LIGHT } from "../Renderer";
import { useTextStyles } from "../Stylex";
import { tr } from "../Translator";

const ALL_SET_ACCOUNTS_KEY = "Utilities.CarouselBoutique.AllAccounts";
export function CarouselBoutique(): JSX.Element {
  const [names, setNames] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isSlim, setIsSlim] = useState(false);
  useEffect(() => {
    const allAc = (
      window.localStorage.getItem(ALL_SET_ACCOUNTS_KEY) || ""
    ).split(ALICORN_SEPARATOR);
    const oc: string[] = [];
    void Promise.all(
      allAc.map(async (a) => {
        const s = await skinTypeFor(new LocalAccount(a));
        if (s !== "NONE" && !oc.includes(a)) {
          oc.push(a);
        }
      })
    ).then(() => {
      setNames(oc);
    });
  }, []);
  const classes = useTextStyles();
  return (
    <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
      <>
        <Typography className={classes.secondText} gutterBottom>
          {tr("Utilities.CarouselBoutique.Hint")}
        </Typography>
        {names.map((n) => {
          return (
            <span
              key={n}
              onClick={() => {
                setPlayerName(n);
              }}
            >
              {n + " "}
            </span>
          );
        })}
        <br />
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
              if (d) {
                setSelectedFile(d);
              }
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
            submitSucc(tr("Utilities.CarouselBoutique.SetSuccessful"));
            const n = names.concat();
            if (!n.includes(playerName)) {
              n.push(playerName);
              setNames(n);
              window.localStorage.setItem(
                ALL_SET_ACCOUNTS_KEY,
                n.join(ALICORN_SEPARATOR)
              );
            }
          }}
        >
          {tr("Utilities.CarouselBoutique.AddAsSkin")}
        </Button>
        <Button
          disabled={
            playerName.trim().length === 0 || selectedFile.trim().length === 0
          }
          style={{ marginLeft: "0.25em" }}
          color={"primary"}
          variant={"contained"}
          onClick={async () => {
            await configureSkin(
              playerName,
              selectedFile,
              isSlim ? "SLIM" : "DEFAULT",
              "-CAPE-"
            );
            submitSucc(tr("Utilities.CarouselBoutique.SetSuccessful"));
          }}
        >
          {tr("Utilities.CarouselBoutique.AddAsCape")}
        </Button>
        <Button
          disabled={playerName.trim().length === 0}
          style={{ marginLeft: "0.25em" }}
          color={"primary"}
          variant={"contained"}
          onClick={async () => {
            await removeSkin(playerName, "-");
            const n = names.concat();
            const i = n.indexOf(playerName);
            if (i >= 0) {
              n.splice(i, 1);
            }
            setNames(n);
            window.localStorage.setItem(
              ALL_SET_ACCOUNTS_KEY,
              n.join(ALICORN_SEPARATOR)
            );
          }}
        >
          {tr("Utilities.CarouselBoutique.RemoveSkin")}
        </Button>
        <Button
          disabled={playerName.trim().length === 0}
          style={{ marginLeft: "0.25em" }}
          color={"primary"}
          variant={"contained"}
          onClick={async () => {
            await removeSkin(playerName, "-CAPE-");
          }}
        >
          {tr("Utilities.CarouselBoutique.RemoveCape")}
        </Button>
        <Button
          disabled={selectedFile.trim().length === 0}
          style={{ marginLeft: "0.25em" }}
          color={"primary"}
          variant={"contained"}
          onClick={async () => {
            await configureDefaultSkin(
              selectedFile,
              isSlim ? "SLIM" : "DEFAULT",
              "-"
            );
            submitSucc(tr("Utilities.CarouselBoutique.SetSuccessful"));
          }}
        >
          {tr("Utilities.CarouselBoutique.SetAsDefaultSkin")}
        </Button>
        <Button
          disabled={selectedFile.trim().length === 0}
          style={{ marginLeft: "0.25em" }}
          color={"primary"}
          variant={"contained"}
          onClick={async () => {
            await configureDefaultSkin(
              selectedFile,
              isSlim ? "SLIM" : "DEFAULT",
              "-CAPE-"
            );
            submitSucc(tr("Utilities.CarouselBoutique.SetSuccessful"));
          }}
        >
          {tr("Utilities.CarouselBoutique.SetAsDefaultCape")}
        </Button>
      </>
    </MuiThemeProvider>
  );
}

async function remoteSelectPng(): Promise<string> {
  return String((await ipcRenderer.invoke("selectPng")) || "");
}
