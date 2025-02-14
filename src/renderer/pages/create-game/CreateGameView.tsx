import { useNav } from "@/renderer/util/nav";
import { PlayerNameInput } from "@components/PlayerNameInput";
import { Radio, RadioGroup } from "@heroui/radio";
import { Button, Input, Switch } from "@heroui/react";
import { AccountSelector } from "@pages/create-game/AccountSelector";
import { ContainerSelector } from "@pages/create-game/ContainerSelector";
import { VersionSelector } from "@pages/create-game/VersionSelector";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";


/**
 * Create new game without the help of the wizard.
 */
export function CreateGameView() {
    const { t } = useTranslation("pages", { keyPrefix: "create-game" });

    const [gameName, setGameName] = useState(t("default-name"));
    const [gameVersion, setGameVersion] = useState<string>();
    const [containerId, setContainerId] = useState<string>();
    const [containerShouldLink, setContainerShouldLink] = useState(true);
    const [shareContainer, setShareContainer] = useState(false);

    const [authType, setAuthType] = useState<"new-vanilla" | "manual" | "reuse">("new-vanilla");
    const [accountId, setAccountId] = useState<string | null>(null);
    const [playerName, setPlayerName] = useState<string>("Player");

    const [assetsLevel, setAssetsLevel] = useState<"full" | "video-only">("full");

    const [creating, setCreating] = useState(false);
    const nav = useNav();

    const valid = [
        gameVersion,
        !(shareContainer && !containerId),
        !(authType === "manual" && !playerName),
        !(authType === "reuse" && !accountId)
    ].every(Boolean);

    async function handleCreate() {
        if (valid) {
            setCreating(true);
            // TODO add error handler
            await native.game.add({
                name: gameName,
                containerId,
                accountId,
                authType,
                playerName,
                profileId: gameVersion!,
                assetsLevel,
                containerShouldLink
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


                <div className="flex flex-col gap-6">
                    <div className="font-bold text-xl">{t("storage-title")}</div>

                    <RadioGroup
                        value={shareContainer ? "share" : "new"}
                        onValueChange={v => setShareContainer(v === "share")}
                    >
                        {
                            ["new", "share"].map(lv =>
                                <div key={lv} className="flex flex-col gap-2">
                                    <Radio value={lv} description={t(`storage-policy.${lv}.sub`)}>
                                        {t(`storage-policy.${lv}.label`)}
                                    </Radio>
                                </div>
                            )
                        }
                    </RadioGroup>

                    {
                        !shareContainer &&
                        <Switch
                            size="sm"
                            isSelected={containerShouldLink}
                            onValueChange={setContainerShouldLink}
                            isDisabled={shareContainer}
                        >
                            <div className="flex flex-col">
                                <div className="text-medium">{t("container-link.label")}</div>
                                <div className="text-foreground-400 text-sm">{t("container-link.sub")}</div>
                            </div>
                        </Switch>
                    }

                    {
                        shareContainer && <ContainerSelector containerId={containerId} onChange={setContainerId}/>
                    }
                </div>


                <div className="flex flex-col gap-4">
                    <div className="font-bold text-xl">{t("account-title")}</div>

                    <RadioGroup
                        value={authType}
                        onValueChange={(s) => setAuthType(s as any)}
                    >
                        <Radio value="new-vanilla" description={t("account.new-vanilla.sub")}>
                            {t("account.new-vanilla.label")}
                        </Radio>

                        <Radio value="manual" description={t("account.manual.sub")}>
                            {t("account.manual.label")}
                        </Radio>

                        <Radio value="reuse" description={t("account.reuse.sub")}>
                            {t("account.reuse.label")}
                        </Radio>

                    </RadioGroup>

                    {
                        authType === "reuse" && <AccountSelector accountId={accountId} onChange={setAccountId}/>
                    }

                    {
                        authType === "manual" && <PlayerNameInput onChange={setPlayerName}/>
                    }
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
