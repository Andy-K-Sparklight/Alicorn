import { remoteInstaller } from "@/renderer/services/install";
import { useNav } from "@/renderer/util/nav";
import { ConfirmPopup } from "@components/ConfirmPopup";
import { Button } from "@heroui/react";
import { useCurrentGameProfile } from "@pages/game-detail/GameProfileProvider";
import { DownloadIcon, UnlinkIcon } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

export function AdvancedPanel() {
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.manage.advanced" });
    const nav = useNav();
    const { id, name } = useCurrentGameProfile();

    async function handleUnlink() {
        await native.game.remove(id);
        nav("/games");
    }

    function handleReinstall() {
        nav("/games");
        void remoteInstaller.install(id);
    }

    return <div className="flex flex-col gap-6">
        <div className="flex items-center">
            <div className="grow flex flex-col gap-1">
                <div className="font-bold text-lg">{t("unlink.label")}</div>
                <div className="text-sm text-foreground-400">{t("unlink.sub")}</div>
            </div>

            <ConfirmPopup
                placement="right"
                title={t("unlink.confirm.title")}
                sub={t("unlink.confirm.sub")}
                btnText={t("unlink.confirm.btn")}
                onConfirm={handleUnlink}
            >
                <Button startContent={<UnlinkIcon/>}>{t("unlink.btn", { name })}</Button>
            </ConfirmPopup>
        </div>

        <div className="flex items-center">
            <div className="grow flex flex-col gap-1">
                <div className="font-bold text-lg">{t("reinstall.label")}</div>
                <div className="text-sm text-foreground-400">{t("reinstall.sub")}</div>
            </div>

            <Button
                startContent={<DownloadIcon/>}
                onPress={handleReinstall}
            >
                {t("reinstall.btn", { name })}
            </Button>
        </div>
    </div>;
}
