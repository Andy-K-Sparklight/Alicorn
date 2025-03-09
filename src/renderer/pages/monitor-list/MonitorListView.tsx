import { procService, type RemoteGameProcess, type RemoteGameStatus, useGameProcList } from "@/renderer/services/proc";
import { useNav } from "@/renderer/util/nav";
import { GameTypeImage } from "@components/GameTypeImage";
import { Button, Card, CardBody, Chip } from "@heroui/react";
import { ArrowRightIcon, XIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

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
    const { id, profile: { type, name }, status } = proc;
    const nav = useNav();

    function revealProc() {
        nav(`/monitor/${proc.id}`);
    }

    function removeProc() {
        procService.remove(id);
    }

    return <Card>
        <CardBody>
            <div className="flex gap-4 items-center h-16 px-3">
                <div className="h-full aspect-square p-3 bg-content2 rounded-full">
                    <GameTypeImage type={type}/>
                </div>

                <div className="font-bold text-xl">{name}</div>

                <div className="ml-auto flex gap-2 items-center">
                    <StatusChip status={status}/>
                </div>


                <div className="ml-4 flex gap-2">
                    <Button isIconOnly color="primary" onPress={revealProc}>
                        <ArrowRightIcon/>
                    </Button>

                    {
                        status !== "running" &&
                        <Button isIconOnly variant="light" onPress={removeProc}>
                            <XIcon/>
                        </Button>
                    }

                </div>
            </div>
        </CardBody>
    </Card>;
}
