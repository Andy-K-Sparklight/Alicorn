import type { GameCoreType } from "@/main/game/spec";
import cobblestone from "@assets/img/cobblestone.webp";
import damagedAnvil from "@assets/img/damaged-anvil.webp";
import fabric from "@assets/img/fabric.webp";
import grassBlock from "@assets/img/grass-block.webp";
import neoforged from "@assets/img/neoforged.webp";
import oakPlanks from "@assets/img/oak-planks.webp";
import quilt from "@assets/img/quilt.webp";
import snowyGrassBlock from "@assets/img/snowy-grass-block.webp";
import tnt from "@assets/img/tnt.webp";
import React from "react";

const imageMap: Record<string, string> = {
    "vanilla-release": grassBlock,
    "vanilla-snapshot": snowyGrassBlock,
    "vanilla-old-alpha": oakPlanks,
    "vanilla-old-beta": cobblestone,
    "forge": damagedAnvil,
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
