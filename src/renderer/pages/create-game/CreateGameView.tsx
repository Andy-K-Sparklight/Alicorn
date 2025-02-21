import type { GameInstallProps } from "@/main/game/spec";
import { useAccounts } from "@/renderer/services/auth";
import { useNav } from "@/renderer/util/nav";
import { Alert } from "@components/Alert";
import { PlayerNameInput } from "@components/PlayerNameInput";
import { Radio, RadioGroup } from "@heroui/radio";
import { addToast, Button, Input, Spinner, Switch } from "@heroui/react";
import { AccountSelector } from "@pages/create-game/AccountSelector";
import { ContainerSelector } from "@pages/create-game/ContainerSelector";
import { VersionSelector } from "@pages/create-game/VersionSelector";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Create new game without the help of the wizard.
 */
export function CreateGameView() {
    const { t } = useTranslation("pages", { keyPrefix: "create-game" });
    const accounts = useAccounts();

    const [gameName, setGameName] = useState(t("default-name"));
    const [gameVersion, setGameVersion] = useState<string>();
    const [containerId, setContainerId] = useState<string>();
    const [containerShouldLink, setContainerShouldLink] = useState(true);
    const [shareContainer, setShareContainer] = useState(false);

    const hasAccount = accounts.length > 0;

    const [authType, setAuthType] = useState<"new-vanilla" | "manual" | "reuse">(hasAccount ? "reuse" : "new-vanilla");
    const [accountId, setAccountId] = useState<string | null>(accounts[0]?.uuid ?? null);
    const [playerName, setPlayerName] = useState<string>("Player");

    const [assetsLevel, setAssetsLevel] = useState<"full" | "video-only">("full");

    const [installType, setInstallType] = useState<string>("vanilla");
    const [fabricOrQuiltVersion, setFabricOrQuiltVersion] = useState<string>("");

    const [creating, setCreating] = useState(false);
    const nav = useNav();

    const [availableModLoaders, setAvailableModLoaders] = useState<string[] | null>(null);

    useEffect(() => {
        if (gameVersion) {
            setAvailableModLoaders(null);
            native.install.queryAvailableModLoaders(gameVersion).then(setAvailableModLoaders);
        } else {
            setAvailableModLoaders([]);
        }
    }, [gameVersion]);

    const valid = gameVersion &&
        !(shareContainer && !containerId) &&
        !(authType === "manual" && !playerName) &&
        !(authType === "reuse" && !accountId);

    function buildInstallProps(): GameInstallProps {
        if (!valid) throw "Cannot create game with incomplete install props";

        switch (installType) {
            case "vanilla":
                return {
                    type: "vanilla",
                    gameVersion
                };
            case "fabric":
            case "quilt":
                return {
                    type: installType,
                    gameVersion,
                    loaderVersion: fabricOrQuiltVersion
                };
        }

        throw `Unsupported mod loader: ${installType}`;
    }

    async function handleCreate() {
        if (valid) {
            setCreating(true);
            await native.game.add({
                name: gameName,
                containerId,
                accountId,
                authType,
                playerName,
                installProps: buildInstallProps(),
                gameVersion,
                assetsLevel,
                containerShouldLink
            });
            setCreating(false);
            addToast({
                color: "success",
                title: t("toast-created")
            });
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
                                <div key={lv} className="flex flex-col gap-2">
                                    <Radio
                                        value={lv}
                                        color={lv === "share" ? "warning" : "primary"}
                                        description={t(`storage-policy.${lv}.sub`)}
                                    >
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
                        shareContainer &&
                        <>
                            <Alert color="warning" classNames={{ title: "font-bold" }} title={t("share-alert")}/>
                            <ContainerSelector containerId={containerId} onChange={setContainerId}/>
                        </>
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

                <div className="flex flex-col gap-4">
                    <div className="font-bold text-xl">{t("mod-loader-title")}</div>

                    <ModLoaderSelector
                        availableModLoaders={availableModLoaders}
                        value={installType}
                        onChange={setInstallType}
                    />

                    {
                        (installType === "fabric" || installType === "quilt") &&
                        <FabricOrQuiltVersionSelector
                            type={installType} value={fabricOrQuiltVersion} onChange={setFabricOrQuiltVersion}
                        />
                    }
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


interface ModLoaderSelectorProps {
    availableModLoaders: string[] | null;
    value: string;
    onChange: (v: string) => void;
}

function ModLoaderSelector({ availableModLoaders, value, onChange }: ModLoaderSelectorProps) {
    const { t } = useTranslation("pages", { keyPrefix: "create-game.mod-loader" });

    const loaders = availableModLoaders ?? [];

    loaders.unshift("vanilla");

    return <>
        <RadioGroup
            value={value}
            onValueChange={onChange}
        >
            {
                availableModLoaders ?
                    ["vanilla", "fabric", "quilt"].map(lv => {
                        if (!loaders.includes(lv)) return null;

                        return <Radio key={lv} value={lv} description={t(`${lv}.sub`)}>
                            {t(`${lv}.label`)}
                        </Radio>;
                    }) :
                    <div className="w-full h-full flex justify-center items-center gap-6">
                        <Spinner variant="wave"/>
                        {t("loading")}
                    </div>
            }
        </RadioGroup>

        <div className="text-sm text-foreground-400">{t("missing")}</div>
    </>;


}

interface FabricVersionSelectorProps {
    type: "fabric" | "quilt";
    value: string;
    onChange: (v: string) => void;
}

function FabricOrQuiltVersionSelector({ type, value, onChange }: FabricVersionSelectorProps) {
    const { t } = useTranslation("pages", { keyPrefix: `create-game.${type}-version` });
    const [isAuto, setIsAuto] = useState(true);

    function handleSelectionChange(v: string) {
        if (v === "auto") {
            onChange("");
        }
        setIsAuto(v !== "manual");
    }

    return <div className="p-4 border-solid border-2 border-foreground-400 rounded-xl flex flex-col gap-4">
        <div className="font-bold text-medium">{t("title")}</div>

        <RadioGroup
            value={isAuto ? "auto" : "manual"}
            color={isAuto ? "primary" : "warning"}
            onValueChange={handleSelectionChange}
        >
            {
                ["auto", "manual"].map(lv =>
                    <Radio key={lv} value={lv}>{t(lv)}</Radio>
                )
            }
        </RadioGroup>

        {
            !isAuto &&
            <>
                <Alert classNames={{ title: "font-bold" }} title={t("alert")} color="warning"/>
                <Input value={value} onValueChange={onChange} label={t("label")} placeholder={t("placeholder")}/>
            </>
        }
    </div>;
}
