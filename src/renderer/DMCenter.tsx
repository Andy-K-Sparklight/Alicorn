import { Box, Card, CardContent, Container, Typography } from "@mui/material";
import fs from "fs-extra";
import os from "os";
import path from "path";
import React, { useEffect, useRef, useState } from "react";
import { isBgDark } from "./Renderer";
import { useCardStyles, useTextStyles } from "./Stylex";
import { tr } from "./Translator";

interface DMInfo {
  id: string; // Folder name
  name: string; // Package name
  description: string; // As display name
  author?: string;
}
const DM_ROOT = path.join(os.homedir(), "alicorn", "dms");

export function DMCenter(): JSX.Element {
  const classes = useTextStyles();
  const [DMs, setDMs] = useState<DMInfo[]>([]);
  const [usingDM, setUsingDM] = useState<string>();
  const lock = useRef<boolean>(false);
  const cardClasses = useCardStyles();
  useEffect(() => {
    if (usingDM === undefined) {
      getUsingDM()
        .then((r) => {
          setUsingDM(r);
        })
        .catch(() => {});
    }
  }, []);
  useEffect(() => {
    if (usingDM) {
      fs.outputFile(path.join(DM_ROOT, ACTIVE_DM), usingDM)
        .then(() => {})
        .catch(() => {});
    }
  }, [usingDM]);
  useEffect(() => {
    const fun = async () => {
      const o: DMInfo[] = [];
      if (!lock.current) {
        lock.current = true;
        try {
          const dmFiles = await fs.readdir(DM_ROOT);
          await Promise.allSettled(
            dmFiles.map(async (f) => {
              const d0 = path.join(DM_ROOT, f);
              const st = await fs.stat(d0);
              if (st.isDirectory()) {
                const pk = path.join(d0, "package.json");
                const meta = await fs.readJSON(pk);
                if (meta.name) {
                  o.push({
                    id: f,
                    name: meta.name,
                    description: meta.description,
                    author: meta.author,
                  });
                }
              }
            })
          );
          setDMs(o);
        } catch {}
        lock.current = false;
      }
    };
    window.addEventListener("focus", fun);
    return () => {
      window.removeEventListener("focus", fun);
    };
  }, []);
  const oDMs = DMs.concat([
    {
      id: "",
      name: "alicorn",
      description: "Alicorn",
      author: "You",
    },
  ]);
  return (
    <Container
      onDrop={(e) => {
        e.stopPropagation();
      }}
      onDragOver={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onDragEnter={(e) => {
        e.stopPropagation();
        e.dataTransfer.dropEffect = "copy";
      }}
    >
      <Typography className={classes.secondText} gutterBottom>
        {tr("DMCenter.Hint")}
      </Typography>
      <br />
      {oDMs.map((d) => {
        return (
          <Box key={d.name}>
            <Card
              className={cardClasses.card}
              color={"primary"}
              raised={true}
              sx={{
                backgroundColor:
                  d.id === usingDM ? "primary.dark" : "primary.main",
              }}
              onClick={() => {
                setUsingDM(d.id);
              }}
            >
              <CardContent>
                <Typography
                  variant={"h6"}
                  sx={{
                    marginLeft: "0.25rem",
                    color: isBgDark() ? "secondary.light" : undefined,
                  }}
                  gutterBottom
                >
                  {d.description}
                </Typography>
                <Typography className={cardClasses.text2}>
                  {`${d.name} / ${d.author || "You"}` +
                    (d.id === usingDM ? " - " + tr("DMCenter.Active") : "")}
                </Typography>
              </CardContent>
            </Card>
            <br />
          </Box>
        );
      })}
    </Container>
  );
}

const ACTIVE_DM = "active.ald";
const PACKAGE = "package.json";
async function getUsingDM(): Promise<string> {
  try {
    const dm = (await fs.readFile(path.join(DM_ROOT, ACTIVE_DM)))
      .toString()
      .trim();
    if (dm.length > 0) {
      const pk = await fs.readJSON(path.join(DM_ROOT, dm, PACKAGE));
      if (pk.main) {
        const f = String(pk.main);
        const t = path.join(DM_ROOT, dm, f);
        await fs.access(t, fs.constants.R_OK);
        return dm;
      }
    }
    return "";
  } catch {
    return "";
  }
}
