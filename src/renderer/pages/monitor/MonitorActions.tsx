import type { RemoteGameStatus } from "@/renderer/services/proc";
import { useNav } from "@/renderer/util/nav";
import { ConfirmPopup } from "@components/modal/ConfirmPopup";
import { Button } from "@heroui/react";
import { ArrowLeftIcon, FolderArchiveIcon, FolderIcon, OctagonXIcon, ScrollTextIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

interface MonitorActionsProps {
    procId: string;
    gameId: string;
    status: RemoteGameStatus;
}

export const MonitorActionsMemo = React.memo(MonitorActions);

function MonitorActions({ procId, gameId, status }: MonitorActionsProps) {
    const { t } = useTranslation("pages", { keyPrefix: "monitor.actions" });
    const nav = useNav();

    function handleStopAction() {
        native.launcher.stop(procId);
    }

    const stopDisabled = status !== "running";

    return <div className="flex flex-col gap-4">
        <Button startContent={<ArrowLeftIcon/>} onPress={() => nav("/monitor")}>
            {t("back-to-list")}
        </Button>
        <Button startContent={<ScrollTextIcon/>} onPress={() => native.game.reveal(gameId, "logs/latest.log")}>
            {t("reveal-logs")}
        </Button>
        <Button startContent={<FolderIcon/>} onPress={() => native.game.reveal(gameId, ".")}>
            {t("reveal-root")}
        </Button>
        <Button startContent={<FolderArchiveIcon/>} onPress={() => native.game.reveal(gameId, "resourcepacks")}>
            {t("reveal-rsp")}
        </Button>
        <ConfirmPopup
            placement="top"
            title={t("stop-title")}
            sub={t("stop-sub")}
            btnText={t("stop-confirm")}
            onConfirm={handleStopAction}
            color="danger"
        >
            <Button
                isDisabled={stopDisabled}
                color="danger"
                startContent={<OctagonXIcon/>}
            >
                {t("stop")}
            </Button>
        </ConfirmPopup>
    </div>;
}
