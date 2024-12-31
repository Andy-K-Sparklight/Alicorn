import { type FC, useEffect, useState } from "react";
import pkg from "~/package.json";
import { CloudOfflineIcon, DashIcon, XIcon } from "@primer/octicons-react";
import { Button } from "@nextui-org/react";

/**
 * Window header.
 */
export const Header: FC = () => {
    const { version } = pkg;

    return <div className="drag shrink-0 grow-0 basis-16 border-b-foreground-300 border-b-1">
        <div className="flex gap-2 h-full items-center px-6">
            <div className="font-bold text-xl ml-2">Alicorn</div>
            <div className="text-md text-foreground-400">{version}</div>

            <div className="ml-auto mr-8">
                <NetworkStatus/>
            </div>

            <div className="no-drag">
                <MinimizeButton/>
            </div>

            <div className="no-drag">
                <CloseButton/>
            </div>
        </div>
    </div>;
};


const CloseButton = () => {
    function closeWindow() {
        native.bwctl.close();
    }

    return <Button isIconOnly variant="light" color="danger" onPress={closeWindow}>
        <XIcon className="text-foreground" size={18}/>
    </Button>;
};

const MinimizeButton = () => {
    function minimizeWindow() {
        native.bwctl.minimize();
    }

    return <Button isIconOnly variant="light" onPress={minimizeWindow}>
        <DashIcon className="text-foreground" size={18}/>
    </Button>;
};

const NetworkStatus = () => {
    const [online, setOnline] = useState(navigator.onLine);

    useEffect(() => {
        function update() {
            setOnline(navigator.onLine);
        }

        window.addEventListener("online", update);
        window.addEventListener("offline", update);
    }, []);

    return online || <CloudOfflineIcon className="text-warning"/>;
};