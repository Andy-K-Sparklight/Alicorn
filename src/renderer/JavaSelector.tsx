import { Refresh } from "@mui/icons-material";
import {
    Button,
    Container,
    FormControl,
    IconButton,
    InputLabel,
    LinearProgress,
    MenuItem,
    Select,
    ThemeProvider,
    Tooltip,
    Typography
} from "@mui/material";
import { ipcRenderer } from "electron";
import path from "path";
import React, { useEffect, useRef, useState } from "react";
import {
    getAllJava,
    getDefaultJavaHome,
    getJavaInfoRaw,
    JavaInfo,
    parseJavaInfo,
    parseJavaInfoRaw,
    resetJavaList,
    setDefaultJavaHome
} from "@/modules/java/JavaInfo";
import { whereJava } from "@/modules/java/WhereJava";
import { setChangePageWarn } from "./GoTo";
import { ShiftEle } from "./Instruction";
import { ALICORN_DEFAULT_THEME_DARK, ALICORN_DEFAULT_THEME_LIGHT, isBgDark } from "./Renderer";
import { useFormStyles } from "./Stylex";
import { tr } from "./Translator";

const CANNOT_LOAD_INFO: JavaInfo = {
    rootVersion: -1,
    vm: "",
    vmSide: "Server",
    bits: "64",
    isFree: true,
    runtime: "",
    version: ""
};

export function JavaSelector(): JSX.Element {
    const classes = useFormStyles();
    const [isJavaInfoLoaded, setLoaded] = useState<boolean>(true);
    const mounted = useRef<boolean>(false);
    const [javaList, setJavaList] = useState<string[]>(getAllJava());
    const [javaInfo, setJavaInfo] = useState<Map<string, JavaInfo>>(new Map());
    const [currentJava, setCurrentJava] = useState<string>(getDefaultJavaHome());
    const [currentJavaInfo, setCurrentJavaInfo] =
        useState<JavaInfo>(CANNOT_LOAD_INFO);
    const [refreshBit, setRefreshBit] = useState<boolean>(false);
    useEffect(() => {
        mounted.current = true;

        void (async () => {
            try {
                const t = parseJavaInfo(
                    parseJavaInfoRaw(await getJavaInfoRaw(currentJava))
                );
                if (mounted.current) {
                    setCurrentJavaInfo(t);
                }
            } catch {
                if (mounted.current) {
                    setCurrentJavaInfo(CANNOT_LOAD_INFO);
                }
            }
        })();

        return () => {
            mounted.current = false;
        };
    }, [refreshBit]);

    useEffect(() => {
        const f = async () => {
            const j = getAllJava();
            if (j.length > 0) {
                setJavaList(j);
                setCurrentJava(j[0]);
                const tMap: Map<string, JavaInfo> = new Map();
                for (const j2 of j) {
                    try {
                        tMap.set(
                            j2,
                            parseJavaInfo(parseJavaInfoRaw(await getJavaInfoRaw(j2)))
                        );
                    } catch {
                        tMap.set(j2, CANNOT_LOAD_INFO);
                    }
                }
                setJavaInfo(tMap);
                setCurrentJavaInfo(
                    parseJavaInfo(parseJavaInfoRaw(await getJavaInfoRaw(j[0])))
                );
            }
        };
        window.addEventListener("ReloadJavaList", f);
        return () => {
            window.removeEventListener("ReloadJavaList", f);
        };
    }, []);

    useEffect(() => {
        void (async () => {
            setChangePageWarn(true);
            let javas;
            if (!isJavaInfoLoaded) {
                javas = await whereJava();
            } else {
                javas = getAllJava();
            }
            if (mounted.current) {
                if (!isJavaInfoLoaded) {
                    resetJavaList(javas);
                }
                setJavaList(javas);
                const tMap: Map<string, JavaInfo> = new Map();
                for (const j of javas) {
                    try {
                        tMap.set(
                            j,
                            parseJavaInfo(parseJavaInfoRaw(await getJavaInfoRaw(j)))
                        );
                    } catch {
                        tMap.set(j, CANNOT_LOAD_INFO);
                    }
                }
                if (mounted.current) {
                    setJavaInfo(tMap);
                    if (currentJava.trim().length === 0 && javas.length > 0) {
                        // If not selected then select
                        setCurrentJava(javas[0] || "");
                    }
                }
                setLoaded(true);
            }
            setChangePageWarn(false);
        })();
    }, [isJavaInfoLoaded, refreshBit]);
    return (
        <ThemeProvider
            theme={
                isBgDark() ? ALICORN_DEFAULT_THEME_DARK : ALICORN_DEFAULT_THEME_LIGHT
            }
        >
            <Container>
                <br/>
                <br/>
                <FormControl variant={"outlined"} fullWidth>
                    <InputLabel id={"Select-JRE"} className={classes.label}>
                        {tr("JavaSelector.SelectJava")}
                    </InputLabel>

                    <ShiftEle name={"JavaSelectorSelect"} bgfill>
                        <Select
                            label={tr("JavaSelector.SelectJava")}
                            variant={"outlined"}
                            labelId={"Select-JRE"}
                            color={"primary"}
                            fullWidth
                            onChange={(e) => {
                                const sj = String(e.target.value);
                                setCurrentJava(sj);
                                setDefaultJavaHome(sj);
                            }}
                            value={currentJava || javaList[0] || ""}
                        >
                            {javaList.map((j) => {
                                return (
                                    <MenuItem key={j} value={j}>
                                        {j}
                                    </MenuItem>
                                );
                            })}
                        </Select>
                    </ShiftEle>
                </FormControl>
                <br/>
                <br/>
                <ShiftEle name={"JavaSelectorManual"}>
                    <Button
                        variant={"contained"}
                        color={"primary"}
                        onClick={() => {
                            void (async () => {
                                const d = path.dirname(path.dirname(await remoteSelectJava()));
                                if (d === "." || d.length === 0) {
                                    return;
                                }
                                if (mounted.current) {
                                    const jlCopy = javaList.concat();
                                    if (!jlCopy.includes(d)) {
                                        jlCopy.push(d);
                                        setJavaList(jlCopy);
                                        resetJavaList(jlCopy);
                                        setRefreshBit(!refreshBit);
                                    }
                                    setCurrentJava(d);
                                }
                            })();
                        }}
                    >
                        {tr("JavaSelector.CustomAdd")}
                    </Button>
                </ShiftEle>
                <Tooltip
                    title={
                        <Typography className={"smtxt"}>
                            {tr("JavaSelector.Reload")}
                        </Typography>
                    }
                >
                    <IconButton
                        color={"primary"}
                        sx={{ marginLeft: "1rem" }}
                        onClick={() => {
                            setLoaded(false);
                        }}
                    >
                        <ShiftEle name={"JavaSelectorSelect"} bgfill>
                            <Refresh/>
                        </ShiftEle>
                    </IconButton>
                </Tooltip>
                <br/>
                <br/>
                {isJavaInfoLoaded ? (
                    ""
                ) : (
                    <>
                        <LinearProgress color={"secondary"}/>
                        <br/>
                        <Typography className={classes.text} color={"primary"} gutterBottom>
                            {tr("JavaSelector.Loading")}
                        </Typography>
                    </>
                )}

                <JavaInfoDisplay
                    jInfo={isJavaInfoLoaded ? javaInfo.get(currentJava) : currentJavaInfo}
                />
            </Container>
        </ThemeProvider>
    );
}

function JavaInfoDisplay(props: { jInfo?: JavaInfo }): JSX.Element {
    const corruptBit =
        props.jInfo?.rootVersion === -1 || props.jInfo === undefined;
    return (
        <>
            <Typography variant={"h6"} color={"primary"} gutterBottom>
                {corruptBit
                    ? tr("JavaSelector.CannotLoad")
                    : `Java ${props.jInfo?.rootVersion || 0}`}
            </Typography>
            {corruptBit ? (
                ""
            ) : (
                <>
                    <Typography color={"secondary"} gutterBottom>
                        {props.jInfo?.runtime || "Unknown"}
                    </Typography>
                    <Typography color={"secondary"} gutterBottom>
                        {props.jInfo?.vm || "Unknown"}
                    </Typography>
                </>
            )}
            {corruptBit ? (
                <Typography
                    sx={{
                        color: "#ff8400"
                    }}
                    className={"smtxt"}
                    gutterBottom
                >
                    {tr("JavaSelector.CannotLoadDetail")}
                </Typography>
            ) : (
                ""
            )}
            {corruptBit ? (
                ""
            ) : (
                <>
                    {props.jInfo?.isFree ? (
                        ""
                    ) : (
                        <Typography
                            sx={{
                                color: "#ff8400"
                            }}
                            gutterBottom
                            className={"smtxt"}
                        >
                            {tr("JavaSelector.WarnNonFree")}
                        </Typography>
                    )}
                    {props.jInfo?.vmSide === "Server" ? (
                        ""
                    ) : (
                        <Typography
                            sx={{
                                color: "#ff8400"
                            }}
                            className={"smtxt"}
                            gutterBottom
                        >
                            {tr("JavaSelector.WarnClient")}
                        </Typography>
                    )}
                    {props.jInfo?.bits === "64" ? (
                        ""
                    ) : (
                        <Typography
                            sx={{
                                color: "#ff8400"
                            }}
                            className={"smtxt"}
                            gutterBottom
                        >
                            {tr("JavaSelector.Warn32")}
                        </Typography>
                    )}
                </>
            )}
        </>
    );
}

async function remoteSelectJava(): Promise<string> {
    return String((await ipcRenderer.invoke("selectJava")) || "");
}
