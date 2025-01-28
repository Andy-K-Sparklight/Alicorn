import { Monitor } from "@pages/monitor/Monitor";
import { useParams } from "wouter";

export function MonitorView() {
    const { procId } = useParams<{ procId: string }>();

    if (procId) {
        return <Monitor procId={procId} key={procId}/>;
    }

    return <MonitorList/>;
}

function MonitorList() {
    // TODO add game processes
    return <div className="w-full"></div>;
}
