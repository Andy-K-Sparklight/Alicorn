import type { GameProfile } from "@/main/game/spec";
import { useGameList } from "@/renderer/services/game";
import { useNav } from "@/renderer/util/nav";
import { Button, ButtonGroup, Spinner, Tooltip } from "@heroui/react";
import { GameCard } from "@pages/games/GameCard";
import { ArrowDownAZIcon, ArrowUpAZIcon, ClockArrowDownIcon, ClockArrowUpIcon, PlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "react-use";

/**
 * The index page of game launching, listing user-defined games for playing.
 */
export function GamesView() {
    const games = useGameList();
    const [sortMethod, setSortMethod] = useLocalStorage<SortMethod>("games.sort-method", "latest");
    const nav = useNav();

    const { t } = useTranslation("pages", { keyPrefix: "games" });

    if (!games) {
        return <LoadingSpinner/>;
    }

    const sortedGames = toSortedGames(games, sortMethod!);

    return <div className="flex flex-col w-full h-full">
        <div className="flex gap-2">
            <Button
                onPress={() => nav("/create-game")}
                fullWidth
                color="primary"
                startContent={<PlusIcon/>}
            >
                {t("new")}
            </Button>

            <SortMethodControl sortMethod={sortMethod!} onChange={setSortMethod}/>
        </div>

        {
            games.length > 0 ?
                <div className="mt-4 w-full h-full overflow-y-auto">
                    <div className="flex flex-col gap-3 w-full">
                        {
                            sortedGames.map(g => <GameCard key={g.id} game={g}/>)
                        }
                    </div>
                </div>
                :
                <EmptyHint/>
        }
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
                <Tooltip content={t(m)} key={m} color="foreground">
                    <Button
                        isIconOnly
                        color={sortMethod === m ? "primary" : "default"}
                        onPress={() => onChange(m)}
                    >
                        {iconMap[m]}
                    </Button>
                </Tooltip>
            )
        }
    </ButtonGroup>;
}

function EmptyHint() {
    const { t } = useTranslation("pages", { keyPrefix: "games.empty-hint" });
    return <div className="w-full h-full flex justify-center items-center gap-6">
        <div className="text-foreground-400 text-center">
            <div className="text-xl font-bold">{t("title")}</div>
            <div className="text-medium">{t("sub")}</div>
        </div>
    </div>;
}

function LoadingSpinner() {
    const { t } = useTranslation("pages", { keyPrefix: "games" });
    return <div className="w-full h-full flex justify-center items-center gap-6">
        <Spinner/>
        {t("loading")}
    </div>;
}
