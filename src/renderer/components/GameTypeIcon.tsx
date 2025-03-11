import type { GameCoreType } from "@/main/game/spec";
import cobblestone from "@assets/img/cobblestone.webp";
import crafter from "@assets/img/crafter.webp";
import craftingTable from "@assets/img/crafting-table.png";
import fabric from "@assets/img/fabric.webp";
import forge from "@assets/img/forge.svg";
import liteloader from "@assets/img/liteloader.webp";
import neoforged from "@assets/img/neoforged.webp";
import oakPlanks from "@assets/img/oak-planks.webp";
import optifine from "@assets/img/optifine.webp";
import quilt from "@assets/img/quilt.webp";
import rift from "@assets/img/rift.webp";
import tnt from "@assets/img/tnt.webp";
import { cn } from "@heroui/react";
import React from "react";

interface GameTypeIconProps extends React.HTMLProps<HTMLDivElement> {
    gameType: GameCoreType;
    wrapperClassName?: string;
}

const imageMap: Record<string, string> = {
    "vanilla-release": craftingTable,
    "vanilla-snapshot": crafter,
    "vanilla-old-alpha": oakPlanks,
    "vanilla-old-beta": cobblestone,
    forge, fabric, quilt, rift, neoforged, liteloader, optifine,
    "unknown": tnt
};


/**
 * Displays a suitable icon for the given game loader type.
 */
export function GameTypeIcon({ gameType, className, wrapperClassName, ...rest }: GameTypeIconProps) {
    const src = imageMap[gameType] ?? tnt;

    return <div className={cn("aspect-square flex", className)} {...rest}>
        <div className={cn("w-full aspect-square rounded-xl bg-content2 p-[15%]", wrapperClassName)}>
            <img src={src} alt={gameType} className="w-full h-full object-contain"/>
        </div>
    </div>;
}
