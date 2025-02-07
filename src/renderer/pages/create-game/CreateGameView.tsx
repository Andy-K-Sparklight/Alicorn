import { Alert } from "@components/Alert";
import { Radio, RadioGroup } from "@heroui/radio";
import { Button, Input } from "@heroui/react";
import { ContainerSelector } from "@pages/create-game/ContainerSelector";
import { VersionSelector } from "@pages/create-game/VersionSelector";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useLocation } from "wouter";


/**
 * Create new game without the help of the wizard.
 */
export function CreateGameView() {
    const { t } = useTranslation("pages", { keyPrefix: "create-game" });

    const [gameName, setGameName] = useState(t("default-name"));
    const [gameVersion, setGameVersion] = useState<string>();
    const [containerId, setContainerId] = useState<string>();
    const [shareContainer, setShareContainer] = useState(false);
    const [assetsLevel, setAssetsLevel] = useState<"full" | "video-only">("full");

    const [creating, setCreating] = useState(false);
    const [, nav] = useLocation();

    const valid = gameVersion && (!shareContainer || (shareContainer && containerId));

    async function handleCreate() {
        if (valid) {
            setCreating(true);
            // TODO add error handler
            await native.game.add({
                name: gameName,
                containerId,
                profileId: gameVersion,
                assetsLevel
            });
            setCreating(false);
            toast(t("toast-created"), { type: "success" });
            nav("/games");
        }
    }

    return <div className="w-11/12 h-full mx-auto overflow-y-auto overflow-x-hidden">
        <div className="mx-4">
            <div className="font-bold text-2xl">{t("title")}</div>
            <div className="w-full grow flex flex-col gap-6 mt-4">
                <div className="flex flex-col gap-4">
                    <div className="font-bold text-xl">{t("name-input-title")}</div>
                    <Input aria-label="Game Name" value={gameName} onValueChange={setGameName}/>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="font-bold text-xl">{t("version-select-title")}</div>
                    <VersionSelector version={gameVersion} onChange={setGameVersion}/>
                </div>


                <div className="flex flex-col gap-4">
                    <div className="font-bold text-xl">{t("storage-title")}</div>

                    <RadioGroup
                        value={shareContainer ? "share" : "new"}
                        onValueChange={v => setShareContainer(v === "share")}
                    >
                        {
                            ["new", "share"].map(lv =>
                                <Radio key={lv} value={lv} description={t(`storage-policy.${lv}.sub`)}>
                                    {t(`storage-policy.${lv}.label`)}
                                </Radio>
                            )
                        }
                    </RadioGroup>

                    <ContainerSelector enabled={shareContainer} containerId={containerId} onChange={setContainerId}/>
                </div>


                <div className="flex flex-col gap-4">
                    <div className="font-bold text-xl">{t("account-title")}</div>

                    <Alert
                        classNames={{ title: "font-bold" }}
                        title={t("account-tip")}
                    />
                </div>

                <div className="flex flex-col gap-4">
                    <div className="font-bold text-xl">{t("assets-title")}</div>

                    <RadioGroup
                        color={assetsLevel === "full" ? "primary" : "warning"}
                        value={assetsLevel}
                        onValueChange={v => setAssetsLevel(v === "video-only" ? "video-only" : "full")}
                    >
                        {
                            ["full", "video-only"].map(lv =>
                                <Radio key={lv} value={lv} description={t(`assets-level.${lv}.sub`)}>
                                    {t(`assets-level.${lv}.label`)}
                                </Radio>
                            )
                        }
                    </RadioGroup>
                </div>

                <Button
                    fullWidth
                    color="primary"
                    size="lg"
                    isDisabled={!valid}
                    onPress={handleCreate}
                    isLoading={creating}
                >
                    {t("create-btn")}
                </Button>
            </div>
        </div>
    </div>;
}
