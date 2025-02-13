import type { ConfigThemes } from "@heroui/react";
import amazingGrace from "~/themes/amazing-grace";
import overworld from "~/themes/overworld";
import twikie from "~/themes/twikie";
import sakuraDark from "./themes/sakura-dark";
import sakuraLight from "./themes/sakura-light";

export default {
    "sakura-light": sakuraLight,
    "sakura-dark": sakuraDark,
    "overworld": overworld,
    "twikie": twikie,
    "amazing-grace": amazingGrace
} satisfies ConfigThemes;
