import { useMpmManifest } from "@/renderer/services/mpm";
import { AddonMetaDisplay } from "@components/AddonMetaDisplay";
import { useCurrentGameProfile } from "@pages/game-detail/GameProfileProvider";
import { VList } from "virtua";

export function LocalAddonsPanel() {
    const { id: gameId } = useCurrentGameProfile();
    const manifest = useMpmManifest(gameId);

    if (!manifest) return null;

    return <div className="flex flex-col h-full gap-2 px-4">
        <VList className="pr-2">
            {
                manifest.resolved.map(p => <AddonMetaDisplay key={p.meta.id} gameId={gameId} meta={p.meta}/>)
            }
        </VList>
    </div>;
}
