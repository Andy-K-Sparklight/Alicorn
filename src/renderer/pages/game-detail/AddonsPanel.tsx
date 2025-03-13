import { AddonSearchList } from "@components/compound/AddonSearchList";
import { useCurrentGameProfile } from "@pages/game-detail/GameProfileProvider";

export function AddonsPanel() {
    const game = useCurrentGameProfile();

    return <div className="h-full px-4">
        <AddonSearchList gameId={game.id}/>
    </div>;
}
