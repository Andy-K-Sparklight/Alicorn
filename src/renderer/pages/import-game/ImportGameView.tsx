import { useNav } from "@/renderer/util/nav";
import { Alert } from "@components/display/Alert";
import { FileSelectInput } from "@components/input/FileSelectInput";
import { Button, Select, SelectItem, type SharedSelection } from "@heroui/react";
import { ImportGameWarningDialog } from "@pages/import-game/ImportGameWarningDialog";
import { useState } from "react";
import { useTranslation } from "react-i18next";

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

    function handleSelectionChange(k: SharedSelection) {
        if (k instanceof Set && k.size > 0) {
            setSelectedProfile([...k][0].toString());
        }
    }

    async function runImport() {
        const name = t("default-name");
        await native.game.importGame(name, gameDir, selectedProfile, "");
        nav("/games");
    }

    const allowImport = gameDir && selectedProfile;

    return <div className="w-5/6 h-full mx-auto flex items-center overflow-y-auto">
        <div className="w-full flex flex-col gap-6 my-auto">
            <h1 className="font-bold text-2xl">{t("title")}</h1>

            <div className="flex flex-col gap-4">
                <h2 className="font-bold text-xl">{t("select-game-dir")}</h2>
                <Alert title={t("select-game-dir-hint")}/>
                <FileSelectInput value={gameDir} onChange={handleGameDirChange}/>
            </div>

            {
                profiles !== null &&
                <div className="flex flex-col gap-4">
                    <h2 className="font-bold text-xl">{t("select-profile")}</h2>
                    {
                        gameDir && profiles.length === 0 &&
                        <Alert title={t("no-profile")} color="danger"/>
                    }
                    {
                        profiles.length > 0 &&
                        <Select
                            selectedKeys={selectedProfile ? [selectedProfile] : []}
                            aria-label="Select Profile"
                            onSelectionChange={handleSelectionChange}
                        >
                            {
                                profiles.map(p => <SelectItem key={p}>{p}</SelectItem>)
                            }
                        </Select>
                    }
                </div>
            }

            <Button isDisabled={!allowImport} onPress={runImport} color="primary">{t("btn")}</Button>
        </div>

        <ImportGameWarningDialog/>
    </div>;
}
