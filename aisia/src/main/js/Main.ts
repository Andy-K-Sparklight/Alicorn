import { app } from "electron";
import * as System from "./System";
import * as IO from "./IO";

export function quit() {
    app.exit();
}

export { System, IO };