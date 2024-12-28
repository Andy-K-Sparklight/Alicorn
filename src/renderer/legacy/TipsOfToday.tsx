import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    ThemeProvider,
    Typography
} from "@mui/material";
import { ipcRenderer, shell } from "electron";
import React, { useEffect, useState } from "react";
import { getBoolean, set } from "@/modules/config/ConfigSupport";
import { ALICORN_DEFAULT_THEME_DARK, ALICORN_DEFAULT_THEME_LIGHT, isBgDark } from "./Renderer";
import { getTip, tr } from "./Translator";

export function TipsOfToday(_props: object): JSX.Element {
    const [tip, setTip] = useState(getTip());
    const [open, setOpen] = useState(getBoolean("features.tips-of-today"));
    useEffect(() => {
        const fun = () => {
            setOpen(false);
        };
        window.addEventListener("closeTips", fun);
        return () => {
            window.removeEventListener("closeTips", fun);
        };
    }, []);
    return (
        <ThemeProvider
            theme={
                isBgDark() ? ALICORN_DEFAULT_THEME_DARK : ALICORN_DEFAULT_THEME_LIGHT
            }
        >
            <Dialog
                open={open}
                onClose={() => {
                    setOpen(false);
                }}
                maxWidth={"sm"}
            >
                <DialogTitle>{i18nTip(tip.name)}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{i18nTip(tip.text)}</DialogContentText>
                    <br/>
                    <img style={{ width: "100%", height: "auto" }} src={tip.img}/>
                </DialogContent>
                <DialogActions>
                    <Typography color={"secondary"} sx={{ fontSize: "smaller" }}>
                        {tr("TipsOfToday.Desc")}
                    </Typography>
                    {tip.rel ? (
                        <Button
                            color={"primary"}
                            onClick={() => {
                                void shell.openExternal(String(tip.rel));
                            }}
                        >
                            {tr("TipsOfToday.More")}
                        </Button>
                    ) : (
                        ""
                    )}
                    <Button
                        color={"primary"}
                        onClick={() => {
                            setTip(getTip());
                        }}
                    >
                        {tr("TipsOfToday.Next")}
                    </Button>
                    <Button
                        color={"primary"}
                        onClick={() => {
                            set("features.tips-of-today", false);
                            setOpen(false);
                        }}
                    >
                        {tr("TipsOfToday.Disable")}
                    </Button>
                    <Button
                        color={"primary"}
                        onClick={() => {
                            setOpen(false);
                        }}
                    >
                        {tr("TipsOfToday.Close")}
                    </Button>
                </DialogActions>
            </Dialog>
        </ThemeProvider>
    );
}

let locale: string;

function i18nTip(origin: Record<string, string>): string {
    locale = locale || ipcRenderer.sendSync("getLocale");
    if (locale.startsWith("zh")) {
        return origin["zh"];
    }
    if (locale.startsWith("en")) {
        return origin["en"];
    }
    return origin[locale] || origin["en"];
}
