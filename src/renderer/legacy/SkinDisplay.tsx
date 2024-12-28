import React, { useEffect, useRef } from "react";

/*
CLAIM FOR EXTERNAL RESOURCE

This modules (SkinDisplay.tsx) uses SkinView3D (SkinView3D.js), which is a work of bs-community.
SkinView3D is licensed under the MIT License and it's a free software (free as in freedom).
It's license is compatible with ours, since we use GPL-3.0.
For details, please see https://github.com/bs-community/skinview3d/blob/master/LICENSE
*/

export function SkinDisplay3D(props: {
    skin: string;
    width?: number;
    height?: number;
}): JSX.Element {
    const myName = useRef(new Date().getTime());
    useEffect(() => {
        // @ts-ignore
        let skinViewer = new skinview3d.SkinViewer({
            canvas: document.getElementById("_skin_view_3d_canvas_" + myName.current),
            width: props.width,
            height: props.height
        });
        skinViewer
            .loadSkin(props.skin)
            .then(() => {})
            .catch(() => {});
        skinViewer.camera.position.x = 22;
        skinViewer.camera.position.y = 13;
        skinViewer.camera.position.z = 37;
        // @ts-ignore
        const orbitControl = skinview3d.createOrbitControls(skinViewer);
        // @ts-ignore
        const walk = skinViewer.animations.add(skinview3d.WalkingAnimation);
        walk.speed = 0.8;
        // @ts-ignore
        const rotate = skinViewer.animations.add(skinview3d.RotatingAnimation);
        rotate.speed = 1.2;
        return () => {
            walk.remove();
            skinViewer = null;
            orbitControl.dispose();
        };
    }, [props.skin, props.width, props.height]);
    return (
        <canvas
            id={"_skin_view_3d_canvas_" + myName.current}
            width={props.width}
            height={props.height}
        />
    );
}

export function SkinDisplay2D(props: { skin: string }): JSX.Element {
    return (
        <span
            style={{
                background: `url('${props.skin}') -4em -4em`,
                backgroundSize: "800%",
                imageRendering: "pixelated",
                width: "4em",
                height: "4em",
                float: "left"
            }}
        ></span>
    );
}
