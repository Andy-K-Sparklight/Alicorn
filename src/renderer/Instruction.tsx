import { Box } from "@mui/material";
import React, { createContext, useEffect, useState } from "react";
import { ALICORN_DEFAULT_THEME_DARK } from "./Renderer";
import { tr } from "./Translator";

function InstructionInside(props: {
  page: string;
  curPage: number;
  target: string;
  changeTarget: (s: string) => unknown;
  setCurPage: (s: number) => unknown;
  changePage: (s: string) => unknown;
}): JSX.Element {
  const curPage = props.curPage;
  const target = props.target;
  const changeTarget = props.changeTarget;
  const setCurPage = props.setCurPage;
  const curInstKey = `Instruction.${props.page}.${curPage}`;
  const curInst = tr(curInstKey);
  // Content@Pos@HighlightTarget
  const alls = curInst.split("@");
  const content = alls[0]
    .replaceAll("<", '<span style="color: #0bbbff;">')
    .replaceAll(">", "</span>");
  const pos = alls[1] || "5.15"; // marginLeft.marginTop
  const fontSize = alls[2] || "large";
  const highlight = alls[3] || "";
  useEffect(() => {
    if (highlight !== target) {
      changeTarget(highlight);
    }
    if (content === "END") {
      setInstBusy(false);
      window.dispatchEvent(new CustomEvent("changeInstPage", { detail: "" }));
      window.dispatchEvent(
        new CustomEvent("InstructionEnd", { detail: props.page })
      ); // Hook dispatch
    }
    if (curInst === curInstKey) {
      setInstBusy(false);
    }
  });
  if (curInst === curInstKey) {
    return <></>;
  }
  if (content === "END") {
    return <></>;
  }

  const [mgl, mgt] = pos.split(".").map((i) => {
    return parseInt(i);
  });
  const mgr = 40 - mgl;
  const mgb = 85 - mgt;
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        backgroundColor: "#21212190",
        zIndex: 10,
      }}
      onClick={(e) => {
        if (e.button === 2) {
          return;
        }
        setCurPage(curPage + 1);
      }}
      onContextMenu={() => {
        setCurPage(-1);
      }}
    >
      <Box
        sx={{
          position: "fixed",
          left: mgl + "%",
          top: mgt + "%",
          right: mgr + "%",
          bottom: mgb + "%",
          display: "flex",
        }}
      >
        <Box
          sx={{
            borderColor: "white",
            borderWidth: "0.125rem",
            borderStyle: "solid",
          }}
        >
          <img
            src={new URL(tr("Avatar")).toString()}
            width={"auto"}
            height={"100%"}
          />
        </Box>
        <Box
          sx={{
            backgroundColor: "#00000095",
            borderColor: "white",
            borderWidth: "0.125rem",
            borderStyle: "solid",
            marginLeft: "1.25rem",
            width: "100%",
          }}
        >
          <Box
            sx={{
              marginTop: "0.625rem",
              marginLeft: "0.5rem",
              marginRight: "0.5rem",
            }}
          >
            <span
              style={{
                fontSize: fontSize,
                color: "white",
              }}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export function Instruction(): JSX.Element {
  return (
    <InstructionHighlight.Consumer>
      {({
        target,
        changeTarget,
        currentNum,
        changeCurrentNum,
        changePage,
        page,
      }) => {
        return (
          <InstructionInside
            page={page}
            curPage={currentNum}
            setCurPage={changeCurrentNum}
            changeTarget={changeTarget}
            target={target}
            changePage={changePage}
          />
        );
      }}
    </InstructionHighlight.Consumer>
  );
}

const InstructionHighlight = createContext({
  target: "",
  changeTarget: (_t: string) => {},
  page: "",
  changePage: (_t: string) => {},
  currentNum: 0,
  changeCurrentNum: (_t: number) => {},
});

export function InstructionProvider(props: {
  children: JSX.Element;
}): JSX.Element {
  const [target, setTarget] = useState("");
  const [page, setPage] = useState("");
  const [currentNum, setCurrentNum] = useState(0);
  const val = {
    target: target,
    changeTarget: setTarget,
    currentNum: currentNum,
    changeCurrentNum: setCurrentNum,
    page: page,
    changePage: setPage,
  };
  const fun = (e: Event) => {
    setCurrentNum(0);
    setPage((e as CustomEvent).detail);
  };
  window.addEventListener("changeInstPage", fun);
  return (
    <InstructionHighlight.Provider value={val}>
      {props.children}
    </InstructionHighlight.Provider>
  );
}

export function ShiftEle(props: {
  children: JSX.Element | string;
  name: string;
  bgcolor?: string;
  bgfill?: boolean;
}): JSX.Element {
  return (
    <InstructionHighlight.Consumer>
      {({ target }) => {
        if (props.name && target === props.name) {
          return (
            <span
              style={{
                zIndex: 100,
                pointerEvents: "none",
                backgroundColor: props.bgfill
                  ? props.bgcolor
                    ? props.bgcolor
                    : ALICORN_DEFAULT_THEME_DARK.palette.secondary.light
                  : undefined,
              }}
            >
              {props.children}
            </span>
          );
        } else {
          return props.children;
        }
      }}
    </InstructionHighlight.Consumer>
  );
}

let busylock = false;

function setInstBusy(b: boolean): void {
  busylock = b;
}

export function isInstBusy(): boolean {
  return busylock;
}

export function startInst(s: string): void {
  setInstBusy(true);
  window.dispatchEvent(new CustomEvent("changeInstPage", { detail: s }));
}
