import damagedAnvil from "@assets/img/damaged-anvil.webp";
import fabric from "@assets/img/fabric.webp";
import grassBlock from "@assets/img/grass-block.webp";
import neoForged from "@assets/img/neoforged.webp";
import quilt from "@assets/img/quilt.webp";
import snowyGrassBlock from "@assets/img/snowy-grass-block.webp";
import tnt from "@assets/img/tnt.webp";
import React from "react";

interface GameTypeImageProps {
    loader: string;
    stable: boolean;
}

/**
 * Picks a suitable image for the given game loader type.
 */
export function GameTypeImage({ loader, stable }: GameTypeImageProps) {
    let src: string;

    switch (loader) {
        case "":
            src = stable ? grassBlock : snowyGrassBlock;
            break;
        case "quilt":
            src = quilt;
            break;
        case "fabric":
            src = fabric;
            break;
        case "neoforged":
            src = neoForged;
            break;
        case "forge":
            src = damagedAnvil;
            break;
        default:
            src = tnt;
            break;
    }


    return <img src={src} alt={loader ?? "vanilla"} className="w-full h-full object-contain"/>;
}
