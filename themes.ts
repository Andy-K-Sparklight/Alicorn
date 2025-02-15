// This file is included by Tailwind CSS which does not support TS paths
// Must use relative path

import type { ConfigThemes } from "@heroui/react";
import amazingGrace from "./themes/amazing-grace";
import overworld from "./themes/overworld";
import sakuraDark from "./themes/sakura-dark";
import sakuraLight from "./themes/sakura-light";
import twikie from "./themes/twikie";

export default {
    "sakura-light": sakuraLight,
    "sakura-dark": sakuraDark,
    "overworld": overworld,
    "twikie": twikie,
    "amazing-grace": amazingGrace
} satisfies ConfigThemes;
