import type { GameCoreType } from "@/main/game/spec";
import cobblestone from "@assets/img/cobblestone.webp";
import crafter from "@assets/img/crafter.webp";
import craftingTable from "@assets/img/crafting-table.png";
import fabric from "@assets/img/fabric.webp";
import forge from "@assets/img/forge.svg";
import neoforged from "@assets/img/neoforged.webp";
import oakPlanks from "@assets/img/oak-planks.webp";
import quilt from "@assets/img/quilt.webp";
import tnt from "@assets/img/tnt.webp";
import React from "react";

const imageMap: Record<string, string> = {
    "vanilla-release": craftingTable,
    "vanilla-snapshot": crafter,
    "vanilla-old-alpha": oakPlanks,
    "vanilla-old-beta": cobblestone,
    "forge": forge,
    "fabric": fabric,
    "quilt": quilt,
    "neoforged": neoforged,
    "unknown": tnt
};

/**
 * Picks a suitable image for the given game loader type.
 */
export function GameTypeImage({ type }: { type: GameCoreType }) {
    const src = imageMap[type] ?? tnt;

    return <img src={src} alt={type} className="w-full h-full object-contain"/>;
}
