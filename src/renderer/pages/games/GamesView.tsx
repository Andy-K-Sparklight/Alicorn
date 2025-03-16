import type { GameProfile } from "@/main/game/spec";

import { useGameList } from "@/renderer/services/games";
import { useNav } from "@/renderer/util/nav";
import { Button, Tab, Tabs, Tooltip } from "@heroui/react";
import { GameCard } from "@pages/games/GameCard";
import {
    ArrowDownAZIcon,
    ArrowUpAZIcon,
    ClockArrowDownIcon,
    ClockArrowUpIcon,
    FolderSymlinkIcon,
    GitMergeIcon,
    PlusIcon
} from "lucide-react";
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

    const sortedGames = toSortedGames(games, sortMethod!);

    return <div className="flex flex-col w-full h-full px-5">
        <div className="flex gap-2 px-3">
            {/* The px-3 above is necessary to align the button with the cards. */}
            <Button
                onPress={() => nav("/games/new-wizard")}
                className="grow"
                color="primary"
                startContent={<PlusIcon/>}
            >
                {t("new")}
            </Button>
            <Button onPress={() => nav("/games/from-modpack")} startContent={<FolderSymlinkIcon/>}>
                {t("from-modpack")}
            </Button>
            <Button onPress={() => nav("/games/import")} startContent={<GitMergeIcon/>}>
                {t("import")}
            </Button>
            <Button onPress={() => nav("/games/new")} startContent={<PlusIcon/>}>
                {t("new-advanced")}
            </Button>

            <SortMethodControl sortMethod={sortMethod!} onChange={setSortMethod}/>
        </div>

        {
            games.length > 0 ?
                <div className="mt-4 w-full h-full overflow-y-auto px-3">
                    {/* The px-3 and py-3 are necessary to reserve space for the card shadow. */}
                    <div className="flex flex-col gap-3 w-full py-3">
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
        const pa = a.user.pinTime;
        const pb = b.user.pinTime;

        if (pa && pb) {
            return pb - pa;
        }

        if (pa) return -1;
        if (pb) return 1;

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

    function handleSelectionChange(k: string | number) {
        onChange(k.toString() as SortMethod);
    }

    return <Tabs
        selectedKey={sortMethod}
        onSelectionChange={handleSelectionChange}
        classNames={{ tab: "px-2" }}
    >
        {
            (["az", "za", "earliest", "latest"] as const).map(m =>
                <Tab
                    key={m}
                    title={
                        <Tooltip content={t(m)} color="foreground">
                            {iconMap[m]}
                        </Tooltip>
                    }
                />
            )
        }
    </Tabs>;
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
