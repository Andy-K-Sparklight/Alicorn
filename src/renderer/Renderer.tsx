import React from "react";
import ReactDOM from "react-dom";
import { App } from "./App";
import { initTranslator } from "./Translator";

const GLOBAL_STYLES: React.CSSProperties = {
  userSelect: "none",
};

function RendererBootstrap(): JSX.Element {
  return (
    <div style={GLOBAL_STYLES}>
      <App />
    </div>
  );
}

initTranslator();
ReactDOM.render(<RendererBootstrap />, document.getElementById("root"));
