import type { GameProfile } from "@/main/game/spec";
import { Button, ButtonGroup, Tooltip } from "@heroui/react";
import { GameCardDisplay } from "@pages/games/GameCard";
import {
    ArrowDownAZIcon,
    ArrowUpAZIcon,
    ClockArrowDownIcon,
    ClockArrowUpIcon,
    PlusIcon,
    RefreshCcwIcon
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "react-use";

/**
 * The index page of game launching, listing user-defined games for playing.
 */
export function GamesView() {
    const [games, setGames] = useState<GameProfile[]>();
    const [sortMethod, setSortMethod] = useLocalStorage<SortMethod>("games.sort-method", "latest");
    const { t } = useTranslation("pages", { keyPrefix: "games" });

    async function loadGames() {
        setGames(await native.game.list());
    }

    useEffect(() => {
        void loadGames();
    }, []);

    const sortedGames = games && toSortedGames(games, sortMethod!);

    return <div className="flex flex-col w-5/6 h-full mx-auto">
        <div className="flex gap-2">
            <Button fullWidth color="primary" size="lg">
                <div className="flex items-center gap-1">
                    <PlusIcon/>
                    {t("new")}
                </div>
            </Button>

            <SortMethodControl sortMethod={sortMethod!} onChange={setSortMethod}/>

            <Tooltip content={t("reload")}>
                <Button isIconOnly size="lg">
                    <RefreshCcwIcon onClick={loadGames}/>
                </Button>
            </Tooltip>

        </div>

        <div className="mt-4 w-full h-full overflow-y-auto">
            <div className="flex flex-col gap-3 w-full">
                {
                    sortedGames?.map(g => <GameCardDisplay key={g.id} gameProfile={g}/>)
                }
            </div>
        </div>
    </div>;
}

function toSortedGames(games: GameProfile[], sortMethod: SortMethod): GameProfile[] {
    return games.toSorted((a, b) => {
        switch (sortMethod) {
            case "az" :
                return a.name.localeCompare(b.name);
            case "za":
                return -a.name.localeCompare(b.name);
            case "latest":
                return b.time - a.time;
            case "earliest":
                return a.time - b.time;
        }
    });
}

type SortMethod = "az" | "za" | "latest" | "earliest";

interface SortMethodControlProps {
    sortMethod: SortMethod;
    onChange: (sortMethod: SortMethod) => void;
}

function SortMethodControl({ sortMethod, onChange }: SortMethodControlProps) {
    const { t } = useTranslation("pages", { keyPrefix: "games.sorting" });

    const iconMap = {
        az: <ArrowUpAZIcon/>,
        za: <ArrowDownAZIcon/>,
        earliest: <ClockArrowUpIcon/>,
        latest: <ClockArrowDownIcon/>
    };

    return <ButtonGroup>
        {
            (["az", "za", "earliest", "latest"] as const).map(m =>
                <Tooltip content={t(m)} key={m}>
                    <Button
                        isIconOnly
                        size="lg"
                        color={sortMethod === m ? "secondary" : "default"}
                        onPress={() => onChange(m)}
                    >
                        {iconMap[m]}
                    </Button>
                </Tooltip>
            )
        }
    </ButtonGroup>;
}
