import { Alert } from "@components/display/Alert";
import { FileSelectInput } from "@components/input/FileSelectInput";
import { Button, ListBox, Select } from "@heroui/react";
import { ImportGameWarningDialog } from "@pages/import-game/ImportGameWarningDialog";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNav } from "@/renderer/util/nav";

export function ImportGameView() {
    const { t } = useTranslation("pages", { keyPrefix: "import-game" });
    const [gameDir, setGameDir] = useState("");
    const [profiles, setProfiles] = useState<string[] | null>(null);
    const [selectedProfile, setSelectedProfile] = useState("");
    const nav = useNav();

    function handleGameDirChange(fp: string) {
        setGameDir(fp);
        native.game.scanImportableProfiles(fp).then(setProfiles);
    }

    async function runImport() {
        const name = t("default-name");
        await native.game.importGame(name, gameDir, selectedProfile, "");
        nav("/games");
    }

    const allowImport = gameDir && selectedProfile;

    return (
        <div className="w-5/6 h-full mx-auto flex items-center overflow-y-auto">
            <div className="w-full flex flex-col gap-6 my-auto">
                <h1 className="font-bold text-2xl">{t("title")}</h1>

                <div className="flex flex-col gap-4">
                    <h2 className="font-bold text-xl">{t("select-game-dir")}</h2>
                    <Alert title={t("select-game-dir-hint")} />
                    <FileSelectInput value={gameDir} onChange={handleGameDirChange} />
                </div>

                {profiles !== null && (
                    <div className="flex flex-col gap-4">
                        <h2 className="font-bold text-xl">{t("select-profile")}</h2>
                        {gameDir && profiles.length === 0 && (
                            <Alert title={t("no-profile")} status="danger" />
                        )}
                        {profiles.length > 0 && (
                            <Select
                                value={selectedProfile || null}
                                onChange={profile => setSelectedProfile(String(profile ?? ""))}
                            >
                                <Select.Trigger>
                                    <Select.Value />
                                    <Select.Indicator />
                                </Select.Trigger>
                                <Select.Popover>
                                    <ListBox>
                                        {profiles.map(p => (
                                            <ListBox.Item key={p} id={p} textValue={p}>
                                                {p}
                                                <ListBox.ItemIndicator />
                                            </ListBox.Item>
                                        ))}
                                    </ListBox>
                                </Select.Popover>
                            </Select>
                        )}
                    </div>
                )}

                <Button isDisabled={!allowImport} onPress={runImport} variant="primary">
                    {t("btn")}
                </Button>
            </div>

            <ImportGameWarningDialog />
        </div>
    );
}
