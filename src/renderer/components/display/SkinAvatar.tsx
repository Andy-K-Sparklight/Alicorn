import { cn } from "@heroui/react";
import type React from "react";
import { getEmptyImage } from "@/renderer/util/misc";

interface SkinAvatarProps extends React.HTMLProps<HTMLDivElement> {
    avatarSrc: [string, string];
}

export function SkinAvatar({ avatarSrc, className, ...rest }: SkinAvatarProps) {
    let [headUrl, helmUrl] = avatarSrc;
    headUrl = headUrl || getEmptyImage();
    helmUrl = helmUrl || getEmptyImage();

    return (
        <div
            className={cn("aspect-square relative overflow-hidden rounded-xs", className)}
            {...rest}
        >
            <img
                alt="Head"
                className="absolute w-full h-full object-contain"
                src={headUrl}
                style={{ imageRendering: "pixelated" }}
            />

            <img
                alt="Helm"
                className="absolute w-full h-full object-contain"
                src={helmUrl}
                style={{ imageRendering: "pixelated" }}
            />
        </div>
    );
}
