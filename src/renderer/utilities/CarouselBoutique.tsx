import {
    Box,
    Button,
    Container,
    FormControl,
    FormControlLabel,
    Grid,
    Radio,
    RadioGroup,
    Tab,
    Tabs,
    TextField,
    ThemeProvider,
    Typography
} from "@mui/material";
import { ipcRenderer } from "electron";
import path from "path";
import React, { useEffect, useState } from "react";
import { LocalAccount } from "@/modules/auth/LocalAccount";
import { MicrosoftAccount } from "@/modules/auth/MicrosoftAccount";
import { ALICORN_SEPARATOR } from "@/modules/commons/Constants";
import { getBoolean } from "@/modules/config/ConfigSupport";
import { waitMSAccountReady } from "@/modules/readyboom/AccountMaster";
import { configureDefaultSkin, configureSkin, removeSkin, skinTypeFor } from "@/modules/skin/LocalYggdrasilServer";
import { setPremiumSkinFromURL, uploadPremiumSkin } from "@/modules/skin/SkinUploader";
import { setChangePageWarn } from "../GoTo";
import { submitInfo, submitSucc, submitWarn } from "../Message";
import { ALICORN_DEFAULT_THEME_DARK, ALICORN_DEFAULT_THEME_LIGHT, isBgDark } from "../Renderer";
import { SkinDisplay2D, SkinDisplay3D } from "../SkinDisplay";
import { useTextStyles } from "../Stylex";
import { tr } from "../Translator";

const ALL_SET_ACCOUNTS_KEY = "Utilities.CarouselBoutique.AllAccounts";

function TabPanel(props: {
    children?: React.ReactNode;
    index: string | number;
    value: string | number;
}): JSX.Element {
    const { children, value, index } = props;
    return (
        <Container hidden={value !== index}>
            <br/>
            {value === index ? <Box>{children}</Box> : ""}
        </Container>
    );
}

export function CarouselBoutique(): JSX.Element {
    const [currentTab, setCurrentTab] = useState(0);
    return (
        <ThemeProvider
            theme={
                isBgDark() ? ALICORN_DEFAULT_THEME_DARK : ALICORN_DEFAULT_THEME_LIGHT
            }
        >
            <Container>
                <Tabs
                    value={currentTab}
                    onChange={(_e, v) => {
                        setCurrentTab(v);
                    }}
                    centered
                >
                    <Tab label={tr("Utilities.CarouselBoutique.Tabs.LocalSkin")}/>
                    <Tab label={tr("Utilities.CarouselBoutique.Tabs.Change")}/>
                </Tabs>
                <TabPanel value={currentTab} index={0}>
                    <CarouselBoutiqueLocalSkin/>
                </TabPanel>
                <TabPanel value={currentTab} index={1}>
                    <CarouselBoutiqueSkinUploader/>
                </TabPanel>
            </Container>
        </ThemeProvider>
    );
}

function CarouselBoutiqueLocalSkin(): JSX.Element {
    const [names, setNames] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState("");
    const [playerName, setPlayerName] = useState("");
    const [isSlim, setIsSlim] = useState(false);
    useEffect(() => {
        const allAc = (localStorage.getItem(ALL_SET_ACCOUNTS_KEY) || "").split(
            ALICORN_SEPARATOR
        );
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
            <br/>
            <br/>
            <FormControl fullWidth>
                <TextField
                    fullWidth
                    color={"primary"}
                    variant={"outlined"}
                    sx={{
                        float: "left"
                    }}
                    onChange={(e) => {
                        setPlayerName(e.target.value);
                    }}
                    spellCheck={false}
                    margin={"dense"}
                    value={playerName}
                    label={tr("Utilities.CarouselBoutique.PlayerName")}
                />
                <br/>
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
                <br/>
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
                        control={<Radio checked={!isSlim}/>}
                        label={
                            <Typography color={"primary"}>
                                {tr("Utilities.CarouselBoutique.Model.Default")}
                            </Typography>
                        }
                    />
                    <FormControlLabel
                        value={"Slim"}
                        control={<Radio checked={isSlim}/>}
                        label={
                            <Typography color={"primary"}>
                                {tr("Utilities.CarouselBoutique.Model.Alex")}
                            </Typography>
                        }
                    />
                </RadioGroup>
            </FormControl>
            <br/>
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
                        localStorage.setItem(
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
                sx={{ marginLeft: "0.25rem" }}
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
                sx={{ marginLeft: "0.25rem" }}
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
                    localStorage.setItem(ALL_SET_ACCOUNTS_KEY, n.join(ALICORN_SEPARATOR));
                }}
            >
                {tr("Utilities.CarouselBoutique.RemoveSkin")}
            </Button>
            <Button
                disabled={playerName.trim().length === 0}
                sx={{ marginLeft: "0.25rem" }}
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
                sx={{ marginLeft: "0.25rem" }}
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
                sx={{ marginLeft: "0.25rem" }}
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
    );
}

function CarouselBoutiqueSkinUploader(): JSX.Element {
    const [skinUrl, setSkinUrl] = useState("");
    const [isRunning, setRunning] = useState(false);
    const [isSlim, setIsSlim] = useState(false);
    const classes = useTextStyles();
    let isValid = false;
    try {
        new URL(skinUrl);
        isValid = true;
    } catch {}
    return (
        <>
            <Typography className={classes.secondText} gutterBottom>
                {tr("Utilities.CarouselBoutique.HintChangeSkin")}
            </Typography>
            <Grid container direction={"row"} flexDirection={"row"}>
                <Grid item>
                    <FormControl fullWidth>
                        <TextField
                            value={skinUrl}
                            fullWidth
                            variant={"outlined"}
                            spellCheck={false}
                            onChange={(e) => {
                                setSkinUrl(e.target.value);
                            }}
                            color={"primary"}
                        />
                        <br/>
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
                                control={<Radio checked={!isSlim}/>}
                                label={
                                    <Typography color={"primary"}>
                                        {tr("Utilities.CarouselBoutique.Model.Default")}
                                    </Typography>
                                }
                            />
                            <FormControlLabel
                                value={"Slim"}
                                control={<Radio checked={isSlim}/>}
                                label={
                                    <Typography color={"primary"}>
                                        {tr("Utilities.CarouselBoutique.Model.Alex")}
                                    </Typography>
                                }
                            />
                        </RadioGroup>
                        <br/>
                        <Button
                            variant={"contained"}
                            color={"primary"}
                            type={"button"}
                            onClick={async () => {
                                const r = await remoteSelectPng();
                                if (r) {
                                    setSkinUrl("file://" + path.resolve(r));
                                }
                            }}
                            sx={{
                                marginTop: "0.25rem"
                            }}
                        >
                            {tr("Utilities.CarouselBoutique.SelectSkinFile")}
                        </Button>
                        <br/>
                        <Button
                            disabled={isRunning || !isValid}
                            variant={"contained"}
                            color={"primary"}
                            type={"button"}
                            onClick={async () => {
                                setRunning(true);
                                setChangePageWarn(true);
                                try {
                                    await uploadSkin(skinUrl, isSlim);
                                } catch {}
                                setChangePageWarn(false);
                                setRunning(false);
                            }}
                        >
                            {tr("Utilities.CarouselBoutique.UploadSkin")}
                        </Button>
                    </FormControl>
                </Grid>
                {skinUrl.length > 0 ? (
                    <Grid item sx={{ marginLeft: "2rem" }}>
                        {getBoolean("features.skin-view-3d") ? (
                            <SkinDisplay3D skin={skinUrl} width={150} height={225}/>
                        ) : (
                            <SkinDisplay2D skin={skinUrl}/>
                        )}
                    </Grid>
                ) : (
                    ""
                )}
            </Grid>
        </>
    );
}

async function remoteSelectPng(): Promise<string> {
    return String((await ipcRenderer.invoke("selectPng")) || "");
}

async function uploadSkin(u: string, isSlim: boolean): Promise<void> {
    submitInfo(tr("Utilities.CarouselBoutique.Uploading"));
    const ux = new URL(u);
    const account = new MicrosoftAccount("");

    if (!(await waitMSAccountReady())) {
        if (!(await account.isAccessTokenValid())) {
            if (!(await account.flushToken())) {
                if (!(await account.performAuth(""))) {
                    submitWarn(tr("Utilities.CarouselBoutique.TokenFailure"));
                }
            }
        }
    }

    try {
        if (ux.protocol.includes("file")) {
            await uploadPremiumSkin(
                account.lastUsedAccessToken,
                isSlim ? "slim" : "classic",
                decodeURIComponent(ux.pathname)
            );
        } else {
            await setPremiumSkinFromURL(
                account.lastUsedAccessToken,
                isSlim ? "slim" : "classic",
                u
            );
        }
    } catch (e) {
        submitWarn(tr("Utilities.CarouselBoutique.UploadFailed", `Reason=${e}`));
        return;
    }
    submitSucc(tr("Utilities.CarouselBoutique.UploadOK"));
}
