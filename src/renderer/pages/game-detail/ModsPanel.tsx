import { ModSearchList } from "@components/ModSearchList";
import { useCurrentGameProfile } from "@pages/game-detail/GameProfileProvider";

export function ModsPanel() {
    const game = useCurrentGameProfile();

    return <div className="h-full px-4">
        <ModSearchList gameId={game.id}/>
    </div>;
}
