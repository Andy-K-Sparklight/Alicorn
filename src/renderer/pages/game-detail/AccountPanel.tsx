import { alter } from "@/main/util/misc";
import { ExtendedAccountPicker } from "@components/compound/ExtendedAccountPicker";
import { useCurrentGameProfile } from "@pages/game-detail/GameProfileProvider";

export function AccountPanel() {
    const game = useCurrentGameProfile();

    function handleAccountChange(id: string) {
        void native.game.update(alter(game, g => g.launchHint.accountId = id));
    }

    return <div className="w-full h-full flex items-center overflow-y-auto p-4">
        <div className="w-2/3 mx-auto my-auto flex flex-col gap-2">
            <ExtendedAccountPicker accountId={game.launchHint.accountId} onAccountChange={handleAccountChange}/>
        </div>
    </div>;
}
