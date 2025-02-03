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
                profileId: gameVersion
            });
            setCreating(false);
            toast(t("toast-created"), { type: "success" });
            nav("/games");
        }
    }

    return <div className="w-11/12 h-full mx-auto flex flex-col items-center gap-4">
        <div className="font-bold text-2xl">{t("title")}</div>
        <div className="w-full grow flex flex-col justify-between mt-4">
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
                    orientation="horizontal"
                    value={shareContainer ? "share" : "new"}
                    onValueChange={v => setShareContainer(v === "share")}
                >
                    <Radio value="new">{t("storage-policy.new")}</Radio>
                    <Radio value="share">{t("storage-policy.share")}</Radio>
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
    </div>;
}
