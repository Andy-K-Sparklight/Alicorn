import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    ThemeProvider
} from "@mui/material";
import { ipcRenderer } from "electron";
import React, { useEffect, useState } from "react";
import {
    ALICORN_DEFAULT_THEME_DARK,
    ALICORN_DEFAULT_THEME_LIGHT,
    isBgDark
} from "./Renderer";
import { randsl, tr } from "./Translator";

export function OperatingHint(props: { open: boolean }): JSX.Element {
    const [saying, setSaying] = useState<string>(
        randsl("ReadyToLaunch.WaitingText")
    );
    useEffect(() => {
        const t = setInterval(() => {
            setSaying(randsl("ReadyToLaunch.WaitingText"));
        }, 5000);
        return () => {
            clearInterval(t);
        };
    });
    return (
        <Dialog open={props.open} disableEscapeKeyDown>
            <DialogTitle>{tr("Operating.PleaseWait")}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {tr("Operating.PleaseWaitDetail")}
                </DialogContentText>
                <DialogContentText>
                    <i>{saying}</i>
                </DialogContentText>
            </DialogContent>
        </Dialog>
    );
}

export function OperatingHintCustom(props: {
    open: boolean;
    msg: string;
}): JSX.Element {
    const [saying, setSaying] = useState<string>(
        randsl("ReadyToLaunch.WaitingText")
    );
    useEffect(() => {
        const t = setInterval(() => {
            setSaying(randsl("ReadyToLaunch.WaitingText"));
        }, 5000);
        return () => {
            clearInterval(t);
        };
    });
    return (
        <Dialog open={props.open} disableEscapeKeyDown>
            <DialogTitle>{tr("Operating.PleaseWait")}</DialogTitle>
            <DialogContent>
                <DialogContentText>{props.msg}</DialogContentText>
                <DialogContentText>
                    <i>{saying}</i>
                </DialogContentText>
            </DialogContent>
        </Dialog>
    );
}

export function FailedHint(props: {
    open: boolean;
    closeFunc: () => unknown;
    reason: string;
}): JSX.Element {
    const reason = tr("Operating.FailedInfo", `Reason=${props.reason}`);
    return (
        <Dialog open={props.open} onClose={props.closeFunc}>
            <>
                <DialogTitle>{tr("Operating.Failed")}</DialogTitle>
                <DialogContent
                    onClick={async () => {
                        await ipcRenderer.send("openDevTools");
                        console.log(
                            "%c" + tr("System.DevToolsWarn1"),
                            "font-size:3.5rem;color:royalblue;font-weight:900;"
                        );
                        console.log(
                            "%c" + tr("System.DevToolsWarn2"),
                            "font-size:1rem;color:red;"
                        );
                        console.log(
                            "%c" + tr("System.DevToolsWarn3"),
                            "font-size:2rem;color:red;"
                        );
                    }}
                >
                    <DialogContentText>{reason}</DialogContentText>
                    <DialogContentText>
                        <b>{tr("Operating.ClickToDebug")}</b>
                        <br/>
                        <i>{randsl("Operating.FailedSayings")}</i>
                    </DialogContentText>
                </DialogContent>
            </>

            <DialogActions>
                <Button onClick={props.closeFunc}>
                    {tr("Operating.FailedConfirm")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export function YNDialog(props: {
    onClose: () => unknown;
    onAccept: () => unknown;
    title: string;
    content: string;
    yes: string;
    no: string;
    open?: boolean;
}): JSX.Element {
    const [open, setOpen] = useState<boolean>(true);
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
                    props.onClose();
                }}
            >
                <DialogTitle>{props.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{props.content}</DialogContentText>
                    <DialogActions>
                        <Button
                            onClick={() => {
                                props.onAccept();
                                setOpen(false);
                            }}
                        >
                            {props.yes}
                        </Button>
                        <Button
                            onClick={() => {
                                setOpen(false);
                                props.onClose();
                            }}
                        >
                            {props.no}
                        </Button>
                    </DialogActions>
                </DialogContent>
            </Dialog>
        </ThemeProvider>
    );
}

export function YNDialog2(props: {
    onClose: () => unknown;
    onAccept: () => unknown;
    title: string;
    content: string;
    yes: string;
    no: string;
    open: boolean;
    noProp?: boolean;
}): JSX.Element {
    return (
        <ThemeProvider
            theme={
                isBgDark() ? ALICORN_DEFAULT_THEME_DARK : ALICORN_DEFAULT_THEME_LIGHT
            }
        >
            <Dialog
                open={props.open}
                onClose={() => {
                    props.onClose();
                }}
                onClick={(e) => {
                    if (props.noProp) {
                        e.stopPropagation();
                    }
                }}
            >
                <DialogTitle>{props.title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{props.content}</DialogContentText>
                    <DialogActions>
                        <Button
                            onClick={(e) => {
                                if (props.noProp) {
                                    e.stopPropagation();
                                }
                                props.onAccept();
                                props.onClose();
                            }}
                        >
                            {props.yes}
                        </Button>
                        <Button
                            onClick={(e) => {
                                if (props.noProp) {
                                    e.stopPropagation();
                                }
                                props.onClose();
                            }}
                        >
                            {props.no}
                        </Button>
                    </DialogActions>
                </DialogContent>
            </Dialog>
        </ThemeProvider>
    );
}
