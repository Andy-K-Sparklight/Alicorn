import { type RemoteGameProcess, type RemoteGameStatus, useGameProcList } from "@/renderer/services/proc";
import { GameTypeImage } from "@components/GameTypeImage";
import { Button, Card, CardBody, Chip } from "@heroui/react";
import { ArrowRightIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";

export function MonitorListView() {
    const procs = useGameProcList();

    return <div className="w-full h-full overflow-y-auto">
        <div className="grid grid-cols-2 gap-4 w-full">
            {
                procs.map(p => <MonitorItem proc={p} key={p.id}/>)
            }
        </div>
    </div>;
}

const statusColors = {
    running: "success",
    crashed: "danger",
    exited: "default"
} as const;

function StatusChip({ status }: { status: RemoteGameStatus }) {
    const { t } = useTranslation("pages", { keyPrefix: "monitor.status" });

    return <Chip
        variant="dot"
        color={statusColors[status]}
    >
        {t(status)}
    </Chip>;
}

function MonitorItem({ proc }: { proc: RemoteGameProcess }) {
    const { detail: { modLoader, stable, name, versionId }, status } = proc;
    const [, nav] = useLocation();

    function revealProc() {
        nav(`/monitor/${proc.id}`);
    }

    return <Card>
        <CardBody>
            <div className="flex gap-4 items-center h-16 px-3">
                <div className="h-full p-3 bg-content2 rounded-full">
                    <GameTypeImage loader={modLoader} stable={stable}/>
                </div>

                <div className="flex flex-col gap-1">
                    <div className="font-bold text-xl">{name}</div>
                    <div className="text-foreground-400">{versionId}</div>
                </div>

                <div className="ml-auto flex gap-2 items-center">
                    <StatusChip status={status}/>
                </div>


                <div className="ml-4">
                    <Button isIconOnly color="primary" onPress={revealProc}>
                        <ArrowRightIcon/>
                    </Button>
                </div>
            </div>
        </CardBody>
    </Card>;
}
