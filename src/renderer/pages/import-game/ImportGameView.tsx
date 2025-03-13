import { useNav } from "@/renderer/util/nav";
import { Alert } from "@components/display/Alert";
import { AccountPicker } from "@components/input/AccountPicker";
import { DirInput } from "@components/input/DirInput";
import { Button, Select, SelectItem, type SharedSelection } from "@heroui/react";
import { ImportGameWarningDialog } from "@pages/import-game/ImportGameWarningDialog";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function ImportGameView() {
    const { t } = useTranslation("pages", { keyPrefix: "import-game" });
    const [gameDir, setGameDir] = useState("");
    const [accountId, setAccountId] = useState("new");
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
        await native.game.importGame(name, gameDir, selectedProfile, accountId);
        nav("/games");
    }

    const allowImport = gameDir && selectedProfile && accountId;

    return <div className="w-11/12 h-full mx-auto overflow-y-auto">
        <div className="flex flex-col gap-6 mt-4">
            <h1 className="font-bold text-2xl">{t("title")}</h1>

            <div className="flex flex-col gap-4">
                <h2 className="font-bold text-xl">{t("select-game-dir")}</h2>
                <Alert title={t("select-game-dir-hint")}/>
                <DirInput value={gameDir} onChange={handleGameDirChange}/>
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


            <div className="flex flex-col gap-4">
                <h2 className="font-bold text-xl">{t("select-account")}</h2>
                <AccountPicker allowCreation accountId={accountId} onChange={setAccountId}/>
            </div>

            <Button isDisabled={!allowImport} onPress={runImport} color="primary">{t("btn")}</Button>
        </div>

        <ImportGameWarningDialog/>
    </div>;
}
