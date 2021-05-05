import React, { useState } from "react";
import {
  Box,
  InputAdornment,
  TextareaAutosize,
  TextField,
} from "@material-ui/core";
import { Send } from "@material-ui/icons";
import { handleCommand } from "../modules/command/CommandHandler";

export function Terminal(): JSX.Element {
  const [logs, setLogs] = useState<string[]>([]);
  return (
    <Box>
      <TextareaAutosize
        style={{
          width: "98%",
          resize: "none",
        }}
        rowsMin={21}
        rowsMax={21}
        value={logs.join("\n")}
        disabled
        onChange={(e) => {
          e.target.scrollTop = e.target.scrollHeight;
        }}
        placeholder={"Logs show here..."}
      />

      <TerminalInput
        onCommand={async (c) => {
          if (c.toLowerCase() === "cls") {
            setLogs([]);
            return;
          }
          let lx = logs.concat(["AL> " + c]);
          if (
            !(await handleCommand(c, (m) => {
              const a = m.split("\n");
              lx = lx.concat(a);
              shiftUntil21(lx);
              setLogs(lx);
            }))
          ) {
            const l = lx.concat(["Unknown command!"]);
            shiftUntil21(l);
            setLogs(l);
          }
        }}
      />
    </Box>
  );
}

function shiftUntil21(arr: string[]): void {
  while (arr.length > 21) {
    arr.shift();
  }
}

export function TerminalInput(props: {
  onCommand: (cmd: string) => unknown;
}): JSX.Element {
  const [enteredCommand, setCommand] = useState<string>("");
  return (
    <Box>
      <TextField
        style={{
          position: "fixed",
          bottom: "2px",
          width: "98%",
          color: "#5d2391",
          backgroundColor: "#d796f0",
        }}
        spellCheck={"false"}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Send />
            </InputAdornment>
          ),
        }}
        color={"primary"}
        fullWidth
        autoFocus
        onKeyDown={(e) => {
          if (enteredCommand.trim().length === 0) {
            setCommand("");
            return;
          }
          if (e.key === "Enter") {
            props.onCommand(enteredCommand);
            setCommand("");
          }
        }}
        onChange={(e) => {
          setCommand(e.target.value);
        }}
        value={enteredCommand}
      />
    </Box>
  );
}
