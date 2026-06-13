import { ConfirmPopup } from "@components/modal/ConfirmPopup";
import { Button } from "@heroui/react";
import {
    ArrowLeftIcon,
    FolderArchiveIcon,
    FolderIcon,
    OctagonXIcon,
    ScrollTextIcon,
} from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import type { RemoteGameStatus } from "@/renderer/services/proc";
import { useNav } from "@/renderer/util/nav";

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

    return (
        <div className="flex flex-col gap-4">
            <Button fullWidth onPress={() => nav("/monitor")}>
                <ArrowLeftIcon />
                {t("back-to-list")}
            </Button>
            <Button fullWidth onPress={() => native.game.reveal(gameId, "logs/latest.log")}>
                <ScrollTextIcon />
                {t("reveal-logs")}
            </Button>
            <Button fullWidth onPress={() => native.game.reveal(gameId, ".")}>
                <FolderIcon />
                {t("reveal-root")}
            </Button>
            <Button fullWidth onPress={() => native.game.reveal(gameId, "resourcepacks")}>
                <FolderArchiveIcon />
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
                <Button fullWidth isDisabled={stopDisabled} variant="danger">
                    <OctagonXIcon />
                    {t("stop")}
                </Button>
            </ConfirmPopup>
        </div>
    );
}
