import type { MpmAddonMeta } from "@/main/mpm/spec";
import { remoteMpm } from "@/renderer/services/mpm";
import { useAddonInstallStatus } from "@/renderer/store/mpm";
import { Button, Chip, Image, Tooltip } from "@heroui/react";
import { CheckIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function AddonMetaDisplay({ gameId, meta }: { gameId: string, meta: MpmAddonMeta }) {
    const { id, vendor, title, description, icon, type } = meta;
    const installStatus = useAddonInstallStatus(gameId, id);
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.manage.addons" });

    const effectiveIcon = icon || "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

    function runInstall() {
        if (installStatus !== "not-installed") return;
        void remoteMpm.addAddon(gameId, type, id);
    }

    function runRemove() {
        if (installStatus !== "installed") return;
        void remoteMpm.removeAddon(gameId, type, id);
    }

    return <div className="px-4 py-2 rounded-xl bg-content1 w-full flex items-center gap-4 mt-2">
        <div className="h-12 aspect-square m-1 rounded-lg overflow-hidden bg-content2 shrink-0">
            <Image src={effectiveIcon} alt={title}/>
        </div>

        <div className="flex flex-col overflow-hidden grow">
            <div className="font-bold text-lg">{title}</div>
            <div className="text-sm text-foreground-500 break-normal">{description}</div>
        </div>

        <Chip size="sm" className="bg-green-800 text-green-200">{t(`vendor.${vendor}`)}</Chip>

        <div className="shrink-0">
            {
                installStatus === "installed" &&
                <Button color="danger" isIconOnly onPress={runRemove}>
                    <TrashIcon/>
                </Button>
            }

            {
                installStatus === "auto-installed" &&
                <Tooltip color="foreground" content={t("auto-install-tip")}>
                    <div>
                        <Button isDisabled isIconOnly>
                            <CheckIcon/>
                        </Button>
                    </div>
                </Tooltip>
            }

            {
                (installStatus === "installing" || installStatus === "not-installed")
                &&
                <Button
                    isLoading={installStatus === "installing"}
                    isIconOnly
                    color="primary"
                    onPress={runInstall}
                >
                    <PlusIcon/>
                </Button>
            }
        </div>
    </div>;
}
