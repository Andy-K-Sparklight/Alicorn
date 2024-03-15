import {
    Box,
    Button,
    Container,
    FormControl,
    InputLabel,
    List,
    ListItem,
    MenuItem,
    Select,
    Tab,
    Tabs,
    TextField,
    ThemeProvider,
    Typography
} from "@mui/material";
import { shell } from "electron";
import objectHash from "object-hash";
import os from "os";
import path from "path";
import React, { useEffect, useState } from "react";
import { getString } from "../../modules/config/ConfigSupport";
import {
    getAllMounted,
    getContainer
} from "../../modules/container/ContainerUtil";
import {
    scanContainerAssets,
    UnifiedAsset
} from "../../modules/pff/modpack/AssetScanner";
import { sealPackCommon } from "../../modules/pff/modpack/MakeModpack";
import { createBaseCommonModel } from "../../modules/pff/modpack/ModpackBuilder";
import { ALICORN_DEFAULT_THEME_LIGHT } from "../Renderer";
import { useFormStyles } from "../Stylex";
import { tr } from "../Translator";

export function BuildUp(): JSX.Element {
    const [rootContainer, setRootContainer] = useState("");
    const [currentTab, setCurrentTab] = useState(0);
    const [assets, setAssets] = useState<UnifiedAsset[]>([]);
    const [meta, setMeta] = useState<ModpackMeta>({
        name: "My Modpack",
        desc: "Off to see the world!",
        author: getString("user.name") || os.userInfo().username,
        version: "1.0"
    });
    return (
        <ThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
            <>
                <Tabs
                    variant={"fullWidth"}
                    value={currentTab}
                    onChange={(_e, v) => {
                        setCurrentTab(v);
                    }}
                >
                    <Tab
                        label={
                            <Typography color={"primary"}>
                                {tr("Utilities.BuildUp.SelectContainer")}
                            </Typography>
                        }
                    />
                    <Tab
                        label={
                            <Typography color={"primary"}>
                                {tr("Utilities.BuildUp.FillInfo")}
                            </Typography>
                        }
                    />
                    <Tab
                        label={
                            <Typography color={"primary"}>
                                {tr("Utilities.BuildUp.SelectAssets")}
                            </Typography>
                        }
                    />
                </Tabs>
                <TabPanel index={0} value={currentTab}>
                    <br/>
                    <SelectContainer
                        setAssets={setAssets}
                        setContainer={setRootContainer}
                    />
                </TabPanel>
                <TabPanel index={1} value={currentTab}>
                    <br/>
                    <FillInfo setMeta={setMeta}/>
                </TabPanel>
                <TabPanel index={2} value={currentTab}>
                    <br/>
                    <SelectAssets assets={assets} meta={meta} container={rootContainer}/>
                </TabPanel>
            </>
        </ThemeProvider>
    );
}

function SelectContainer(props: {
    setAssets: (a: UnifiedAsset[]) => unknown;
    setContainer: (c: string) => unknown;
}): JSX.Element {
    const [slc, setSlc] = useState(getAllMounted()[0] || "");
    const [ast, setAST] = useState(0);
    const classes = useFormStyles();
    return (
        <Container>
            <FormControl variant={"outlined"} fullWidth>
                <InputLabel id={"Select-Pack-Container"} className={classes.label}>
                    {tr("Utilities.BuildUp.BaseContainer")}
                </InputLabel>
                <Select
                    label={tr("Utilities.BuildUp.BaseContainer")}
                    variant={"outlined"}
                    labelId={"Select-Pack-Container"}
                    color={"primary"}
                    value={slc}
                    fullWidth
                    onChange={(c) => {
                        setSlc(String(c.target.value));
                        props.setContainer(String(c.target.value));
                    }}
                >
                    {getAllMounted().map((c) => {
                        return (
                            <MenuItem key={c} value={c}>
                                {c}
                            </MenuItem>
                        );
                    })}
                </Select>
                <br/>
                <Button
                    disabled={slc.length === 0}
                    type={"button"}
                    color={"primary"}
                    variant={"contained"}
                    onClick={async () => {
                        const a = await scanContainerAssets(getContainer(slc));
                        props.setAssets(a);
                        props.setContainer(slc);
                        setAST(a.length);
                    }}
                >
                    {tr("Utilities.BuildUp.Scan")}
                </Button>
                <br/>
                {ast > 0 ? (
                    <Typography color={"primary"}>
                        {tr(
                            "Utilities.BuildUp.ScanResult",
                            `Container=${slc}`,
                            `Count=${ast}`
                        )}
                    </Typography>
                ) : (
                    ""
                )}
            </FormControl>
        </Container>
    );
}

function TabPanel(props: {
    children?: React.ReactNode;
    index: string | number;
    value: string | number;
}): JSX.Element {
    const {children, value, index} = props;
    return (
        <Box hidden={value !== index}>{value === index ? <>{children}</> : ""}</Box>
    );
}

interface ModpackMeta {
    name: string;
    author: string;
    version: string;
    desc: string;
}

function FillInfo(props: {
    setMeta: (m: ModpackMeta) => unknown;
}): JSX.Element {
    const [meta2, setMeta2] = useState<ModpackMeta>({
        name: "My Modpack",
        desc: "Off to see the world!",
        author: getString("user.name") || os.userInfo().username,
        version: "1.0"
    });
    return (
        <Container>
            <FormControl fullWidth>
                <TextField
                    variant={"outlined"}
                    label={tr("Utilities.BuildUp.Meta.Name")}
                    spellCheck={false}
                    type={"text"}
                    color={"primary"}
                    fullWidth
                    autoFocus
                    onChange={(e) => {
                        const m = Object.assign({}, meta2);
                        m.name = e.target.value;
                        setMeta2(m);
                        props.setMeta(m);
                    }}
                    value={meta2.name}
                />
                <br/>
                <TextField
                    variant={"outlined"}
                    label={tr("Utilities.BuildUp.Meta.Desc")}
                    spellCheck={false}
                    margin={"dense"}
                    fullWidth
                    type={"text"}
                    onChange={(e) => {
                        const m = Object.assign({}, meta2);
                        m.desc = e.target.value;
                        setMeta2(m);
                        props.setMeta(m);
                    }}
                    value={meta2.desc}
                />
                <br/>
                <TextField
                    variant={"outlined"}
                    label={tr("Utilities.BuildUp.Meta.Author")}
                    spellCheck={false}
                    fullWidth
                    type={"text"}
                    color={"primary"}
                    onChange={(e) => {
                        const m = Object.assign({}, meta2);
                        m.author = e.target.value;
                        setMeta2(m);
                        props.setMeta(m);
                    }}
                    value={meta2.author}
                />
                <br/>
                <TextField
                    variant={"outlined"}
                    label={tr("Utilities.BuildUp.Meta.Version")}
                    spellCheck={false}
                    type={"text"}
                    color={"primary"}
                    fullWidth
                    onChange={(e) => {
                        const m = Object.assign({}, meta2);
                        m.version = e.target.value;
                        setMeta2(m);
                        props.setMeta(m);
                    }}
                    value={meta2.version}
                />
            </FormControl>
        </Container>
    );
}

function SelectAssets(props: {
    assets: UnifiedAsset[];
    container: string;
    meta: ModpackMeta;
}): JSX.Element {
    const [container, setContainer] = useState(props.container);
    const [selectedAssets, setSelectedAssets] = useState<Set<UnifiedAsset>>(
        new Set()
    );
    const [buttonState, setButtonState] = useState("Utilities.BuildUp.Build");
    const astBuff = new Set(props.assets);
    selectedAssets.forEach((s) => {
        astBuff.delete(s);
    });

    useEffect(() => {
        if (props.container !== container) {
            setSelectedAssets(new Set());
            setContainer(props.container); // Clear if diff
        }
    });
    return (
        <>
            <Button
                type={"button"}
                color={"primary"}
                variant={"contained"}
                onClick={() => {
                    setSelectedAssets(new Set(props.assets));
                }}
            >
                {tr("Utilities.BuildUp.Asset.SelectAll")}
            </Button>
            <Button
                type={"button"}
                sx={{marginLeft: "0.25rem"}}
                color={"primary"}
                variant={"contained"}
                onClick={() => {
                    const o = new Set<UnifiedAsset>();
                    props.assets.forEach((a) => {
                        if (a.desc === "ModFile" || a.desc === "PffMod") {
                            o.add(a);
                        }
                    });
                    setSelectedAssets(o);
                }}
            >
                {tr("Utilities.BuildUp.Asset.SelectMods")}
            </Button>
            <Button
                disabled={
                    buttonState !== "Utilities.BuildUp.Build" || selectedAssets.size === 0
                }
                type={"button"}
                sx={{marginLeft: "0.25rem"}}
                color={"primary"}
                variant={"contained"}
                onClick={() => {
                    void (async () => {
                        try {
                            const model = createBaseCommonModel();
                            model.name = props.meta.name;
                            model.version = props.meta.version;
                            model.author = props.meta.author;
                            model.description = props.meta.desc;
                            await sealPackCommon(
                                model,
                                Array.from(selectedAssets),
                                getContainer(container),
                                (s) => {
                                    setButtonState("Utilities.BuildUp." + s);
                                }
                            );
                        } catch (e) {
                            setButtonState("Utilities.BuildUp.Build");
                            console.log(e);
                        }
                    })();
                }}
            >
                {tr(buttonState)}
            </Button>
            <Button
                type={"button"}
                color={"primary"}
                sx={{marginLeft: "0.25rem"}}
                variant={"contained"}
                onClick={() => {
                    void shell.showItemInFolder(
                        getContainer(props.container).resolvePath(
                            props.meta.name.toLowerCase() + ".prod.zip"
                        )
                    );
                }}
            >
                {tr("Utilities.BuildUp.Show")}
            </Button>
            <Box sx={{display: "flex", flexDirection: "row"}}>
                <List sx={{width: "50%", display: "inline"}}>
                    <ListItem>
                        <Typography color={"secondary"}>
                            {tr("Utilities.BuildUp.SelectedAsset")}
                        </Typography>
                    </ListItem>
                    {Array.from(selectedAssets.values()).map((asset, i) => {
                        return (
                            <ListItem
                                key={objectHash(asset)}
                                onClick={() => {
                                    const as = new Set(selectedAssets);
                                    as.delete(asset);
                                    setSelectedAssets(as);
                                }}
                            >
                                {
                                    <Typography color={"primary"}>
                    <span
                        dangerouslySetInnerHTML={{__html: toAssetString(asset)}}
                    />
                                    </Typography>
                                }
                            </ListItem>
                        );
                    })}
                </List>
                <List sx={{width: "50%", display: "inline"}}>
                    <ListItem>
                        <Typography color={"secondary"}>
                            {tr("Utilities.BuildUp.Asset")}
                        </Typography>
                    </ListItem>
                    {Array.from(astBuff.values()).map((asset) => {
                        return (
                            <ListItem
                                key={objectHash(asset)}
                                onClick={() => {
                                    const a = new Set(selectedAssets);
                                    a.add(asset);
                                    setSelectedAssets(a);
                                }}
                            >
                                {
                                    <Typography color={"primary"}>
                    <span
                        dangerouslySetInnerHTML={{__html: toAssetString(asset)}}
                    />
                                    </Typography>
                                }
                            </ListItem>
                        );
                    })}
                </List>
            </Box>
        </>
    );
}

function toAssetString(u: UnifiedAsset): string {
    let pre = `[${tr("Utilities.BuildUp.Asset." + u.desc)}] `;
    switch (u.type) {
        case "FILE":
        case "DIR":
            pre += path.basename(u.v1);
            break;
        case "ADDON": {
            let pName = "Unknown";
            if (u.v1 === "game") {
                pre = "<b>" + pre;
                pName = "Mojang/" + u.v2 + "</b>";
            }
            if (u.v1 === "fabric") {
                pName = "Fabric/" + u.v2 + ` (${u.mcv})`;
            }
            if (u.v1 === "forge") {
                pName = "Forge/" + u.v2;
            }
            pre += pName;
        }
            break;
        case "MOD":
            pre += `${u.pffName} (${u.pffFileName})`;
    }
    return pre;
}
