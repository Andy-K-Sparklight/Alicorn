import { Box } from "@material-ui/core";
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
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        backgroundColor: "#21212190",
        zIndex: 10,
      }}
      onClick={() => {
        setCurPage(curPage + 1);
      }}
    >
      <Box
        style={{
          position: "fixed",
          left: mgl + "%",
          top: mgt + "%",
          right: mgr + "%",
          bottom: mgb + "%",
          display: "flex",
        }}
      >
        <Box
          style={{
            borderColor: "white",
            borderWidth: "2px",
            borderStyle: "solid",
          }}
        >
          <img src={tr("Avatar")} width={"auto"} height={"100%"} />
        </Box>
        <Box
          style={{
            backgroundColor: "#00000095",
            borderColor: "white",
            borderWidth: "2px",
            borderStyle: "solid",
            marginLeft: "20px",
            width: "100%",
          }}
        >
          <Box
            style={{
              marginTop: "10px",
              // marginBottom: "8px",
              marginLeft: "8px",
              marginRight: "8px",
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

export const InstructionHighlight = createContext({
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

export function setInstBusy(b: boolean): void {
  busylock = b;
}

export function isInstBusy(): boolean {
  return busylock;
}

export function startInst(s: string): void {
  setInstBusy(true);
  window.dispatchEvent(new CustomEvent("changeInstPage", { detail: s }));
}
