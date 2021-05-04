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
        rowsMin={20}
        rowsMax={20}
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
          const lx = logs.concat(["AL> " + c]);
          if (
            !(await handleCommand(c, (m) => {
              lx.push(m);
              shiftUntil20(lx);
              setLogs(lx);
            }))
          ) {
            const l = lx.concat(["Unknown command!"]);
            shiftUntil20(l);
            setLogs(l);
          }
        }}
      />
    </Box>
  );
}

function shiftUntil20(arr: string[]): void {
  while (arr.length > 20) {
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
          color: "#5d2391",
          backgroundColor: "#d796f0",
          paddingRight: "10px",
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
