import {
  Box,
  Button,
  FormControl,
  InputLabel,
  List,
  ListItem,
  MenuItem,
  MuiThemeProvider,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@material-ui/core";
import objectHash from "object-hash";
import os from "os";
import path from "path";
import React, { useEffect, useState } from "react";
import { getString } from "../../modules/config/ConfigSupport";
import {
  getAllMounted,
  getContainer,
} from "../../modules/container/ContainerUtil";
import {
  scanContainerAssets,
  UnifiedAsset,
} from "../../modules/pff/modpack/AssetScanner";
import { sealPackCommon } from "../../modules/pff/modpack/MakeModpack";
import { createBaseCommonModel } from "../../modules/pff/modpack/ModpackBuilder";
import { ALICORN_DEFAULT_THEME_LIGHT } from "../Renderer";
import { fullWidth, useFormStyles, useInputStyles } from "../Stylex";
import { tr } from "../Translator";

export function BuildUp(): JSX.Element {
  const [rootContainer, setRootContainer] = useState("");
  const [currentTab, setCurrentTab] = useState(0);
  const [assets, setAssets] = useState<UnifiedAsset[]>([]);
  const [meta, setMeta] = useState<ModpackMeta>({
    name: "My Modpack",
    desc: "Off to see the world!",
    author: getString("user.name") || os.userInfo().username,
    version: "1.0",
  });
  return (
    <MuiThemeProvider theme={ALICORN_DEFAULT_THEME_LIGHT}>
      <>
        <Tabs
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
          <br />
          <SelectContainer
            setAssets={setAssets}
            setContainer={setRootContainer}
          />
        </TabPanel>
        <TabPanel index={1} value={currentTab}>
          <br />
          <FillInfo setMeta={setMeta} />
        </TabPanel>
        <TabPanel index={2} value={currentTab}>
          <br />
          <SelectAssets assets={assets} meta={meta} container={rootContainer} />
        </TabPanel>
      </>
    </MuiThemeProvider>
  );
}

function SelectContainer(props: {
  setAssets: (a: UnifiedAsset[]) => unknown;
  setContainer: (c: string) => unknown;
}): JSX.Element {
  const [slc, setSlc] = useState(getAllMounted()[0] || "");
  const [ast, setAST] = useState(0);
  const classes = useFormStyles();
  const fullWidthClasses = fullWidth();
  return (
    <FormControl variant={"outlined"}>
      <InputLabel id={"Select-Pack-Container"} className={classes.label}>
        {tr("Utilities.BuildUp.BaseContainer")}
      </InputLabel>
      <Select
        label={tr("Utilities.BuildUp.BaseContainer")}
        variant={"outlined"}
        labelId={"Select-Pack-Container"}
        color={"primary"}
        className={fullWidthClasses.form}
        value={slc}
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
      <br />
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
      <br />
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
  );
}

function TabPanel(props: {
  children?: React.ReactNode;
  index: string | number;
  value: string | number;
}): JSX.Element {
  const { children, value, index } = props;
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
    version: "1.0",
  });
  const classes = useInputStyles();
  const fullWidthClasses = fullWidth();
  return (
    <>
      <FormControl>
        <TextField
          variant={"outlined"}
          label={tr("Utilities.BuildUp.Meta.Name")}
          spellCheck={false}
          margin={"dense"}
          type={"text"}
          autoFocus
          className={classes.input + " " + fullWidthClasses.largerForm}
          onChange={(e) => {
            const m = Object.assign({}, meta2);
            m.name = e.target.value;
            setMeta2(m);
            props.setMeta(m);
          }}
          value={meta2.name}
        />
        <br />
        <TextField
          variant={"outlined"}
          label={tr("Utilities.BuildUp.Meta.Desc")}
          spellCheck={false}
          margin={"dense"}
          type={"text"}
          autoFocus
          className={classes.input + " " + fullWidthClasses.largerForm}
          onChange={(e) => {
            const m = Object.assign({}, meta2);
            m.desc = e.target.value;
            setMeta2(m);
            props.setMeta(m);
          }}
          value={meta2.desc}
        />
        <br />
        <TextField
          variant={"outlined"}
          label={tr("Utilities.BuildUp.Meta.Author")}
          spellCheck={false}
          margin={"dense"}
          type={"text"}
          autoFocus
          className={classes.input + " " + fullWidthClasses.largerForm}
          onChange={(e) => {
            const m = Object.assign({}, meta2);
            m.author = e.target.value;
            setMeta2(m);
            props.setMeta(m);
          }}
          value={meta2.author}
        />
        <br />
        <TextField
          variant={"outlined"}
          label={tr("Utilities.BuildUp.Meta.Version")}
          spellCheck={false}
          margin={"dense"}
          type={"text"}
          autoFocus
          className={classes.input + " " + fullWidthClasses.largerForm}
          onChange={(e) => {
            const m = Object.assign({}, meta2);
            m.version = e.target.value;
            setMeta2(m);
            props.setMeta(m);
          }}
          value={meta2.version}
        />
      </FormControl>
    </>
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
        style={{ marginLeft: "4px" }}
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
        style={{ marginLeft: "4px" }}
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
      <Box style={{ display: "flex", flexDirection: "row" }}>
        <List style={{ width: "50%", display: "inline" }}>
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
                      dangerouslySetInnerHTML={{ __html: toAssetString(asset) }}
                    />
                  </Typography>
                }
              </ListItem>
            );
          })}
        </List>
        <List style={{ width: "50%", display: "inline" }}>
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
                      dangerouslySetInnerHTML={{ __html: toAssetString(asset) }}
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
    case "ADDON":
      {
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
