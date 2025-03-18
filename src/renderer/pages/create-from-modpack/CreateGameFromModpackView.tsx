import type { ModpackMetaSlim } from "@/main/modpack/common";
import { useNav } from "@/renderer/util/nav";
import { Alert } from "@components/display/Alert";
import { FileSelectInput } from "@components/input/FileSelectInput";
import { addToast, Button } from "@heroui/react";
import type { FileFilter } from "electron";
import { t } from "i18next";
import { type DragEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function CreateGameFromModpackView() {
    const { t } = useTranslation("pages", { keyPrefix: "create-game-from-modpack" });
    const [modpackFile, setModpackFile] = useState("");
    const [modpackMeta, setModpackMeta] = useState<ModpackMetaSlim | null>(null);
    const [btnConfirmed, setBtnConfirmed] = useState(false);
    const [deploying, setDeploying] = useState(false);
    const nav = useNav();

    useEffect(() => {
        if (modpackFile) {
            native.modpack.readMeta(modpackFile).then(setModpackMeta);
        }
    }, [modpackFile]);

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) {
            const f = e.dataTransfer.files[0];
            setModpackFile(native.ext.getRealFilePath(f));
        }
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "link";
    }

    function handleBtnClick() {
        if (!btnConfirmed) {
            setBtnConfirmed(true);
        } else {
            setDeploying(true);
            native.modpack.deploy(modpackFile).then(() => {
                addToast({
                    color: "success",
                    title: t("toast", { ...modpackMeta })
                });
                nav("/games");
            }).finally(() => setDeploying(false));
        }
    }

    return <div className="w-full h-full overflow-y-auto flex items-center">
        <div
            className="w-5/6 mx-auto flex flex-col my-auto gap-4"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <h1 className="font-bold text-2xl">{t("title")}</h1>

            <p className="text-foreground-400 text-medium">{t("hint")}</p>

            <FileSelectInput value={modpackFile} onChange={setModpackFile} selector={selectModpackFile}/>

            {
                modpackMeta &&
                <>
                    <p className="text-success font-bold">
                        {t("meta", { ...modpackMeta })}
                    </p>

                    <p className="text-foreground-400 text-sm">{t("install-hint")}</p>
                </>
            }

            {
                modpackFile && !modpackMeta &&
                <p className="text-danger font-bold">
                    {t("no-meta")}
                </p>
            }

            <div>
                <Alert color="warning" classNames={{ title: "font-bold" }} title={t("alert")}/>
            </div>

            {
                modpackMeta &&
                <div>
                    <Button
                        isLoading={deploying} fullWidth color={btnConfirmed ? "primary" : "warning"}
                        onPress={handleBtnClick}
                    >
                        {t(btnConfirmed ? "btn.install" : "btn.confirm", { ...modpackMeta })}
                    </Button>
                </div>
            }
        </div>
    </div>;
}

async function selectModpackFile() {
    const filters: FileFilter[] = [
        { name: t("pages:create-game-from-modpack.select-filter"), extensions: ["zip", "mrpack"] }
    ];

    return await native.ext.selectFile(filters);
}
