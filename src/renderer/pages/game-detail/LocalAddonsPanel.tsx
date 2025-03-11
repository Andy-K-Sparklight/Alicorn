import { useMpmManifest } from "@/renderer/services/mpm";
import { AddonMetaDisplay } from "@components/AddonMetaDisplay";
import { useCurrentGameProfile } from "@pages/game-detail/GameProfileProvider";
import { useTranslation } from "react-i18next";
import { VList } from "virtua";

export function LocalAddonsPanel() {
    const { id: gameId } = useCurrentGameProfile();
    const { t } = useTranslation("pages", { keyPrefix: "game-detail.manage.local-addons" });
    const manifest = useMpmManifest(gameId);

    if (!manifest) return null;

    return <div className="flex flex-col h-full gap-2 px-4">
        {
            manifest.resolved.length === 0 ?
                <div className="grow flex items-center justify-center font-bold text-foreground-400 text-lg">
                    {t("empty")}
                </div>
                :
                <VList className="pr-2">
                    {
                        manifest.resolved.map(p => <AddonMetaDisplay key={p.meta.id} gameId={gameId} meta={p.meta}/>)
                    }
                </VList>

        }
    </div>;
}
