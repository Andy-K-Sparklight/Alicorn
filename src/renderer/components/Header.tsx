import { TopNavigator } from "@components/TopNavigator";
import { DashIcon, XIcon } from "@primer/octicons-react";
import React, { type FC } from "react";

/**
 * Window header.
 */
export const Header: FC = () => {
    return <div className="drag shrink-0 grow-0 basis-20">
        <div className="flex gap-2 h-full justify-center items-center px-8">
            <div className="no-drag">
                <TopNavigator/>
            </div>

            <CloseButton/>
            <MinimizeButton/>
        </div>
    </div>;
};


/**
 * The close button. Shows on the right corner when the cursor is moved near it, otherwise hidden for a cleaner LAF.
 */
const CloseButton = () => {
    return <div
        onClick={closeWindow}
        className="opacity-0 hover:opacity-100 duration-300 cursor-pointer no-drag
    fixed top-0 right-0 w-16 h-16 bg-danger flex justify-center items-center rounded-bl-full"
    >
        <XIcon className="text-foreground ml-3 mb-3" size={24}/>
    </div>;
};

const MinimizeButton = () => {
    return <div
        onClick={minimizeWindow}
        className="opacity-0 hover:opacity-100 duration-300 cursor-pointer no-drag
    fixed top-0 left-0 w-16 h-16 bg-default flex justify-center items-center rounded-br-full"
    >
        <DashIcon className="text-foreground mr-3 mb-3" size={24}/>
    </div>;
};

function closeWindow() {
    native.bwctl.close();
}

function minimizeWindow() {
    native.bwctl.minimize();
}
