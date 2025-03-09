import { useMpmManifest } from "@/renderer/store/mpm";
import { ModMetaDisplay } from "@components/ModMetaDisplay";
import { useCurrentGameProfile } from "@pages/game-detail/GameProfileProvider";
import { VList } from "virtua";

export function LocalModsPanel() {
    const { id: gameId } = useCurrentGameProfile();
    const installedMods = useMpmManifest(gameId);

    if (!installedMods) return null;

    console.log(installedMods.resolved);

    return <div className="flex flex-col h-full gap-2 px-4">
        <VList className="pr-2">
            {
                installedMods.resolved
                    .map(p => p.meta)
                    .map(r => <ModMetaDisplay key={r.id} gameId={gameId} meta={r}/>)
            }
        </VList>
    </div>;
}
