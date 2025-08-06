import type { SerializedException } from "@/main/except/exception";
import { isTruthy } from "@/main/util/misc";
import { TipPicker } from "@components/display/TipPicker";
import { MessageBox } from "@components/modal/MessageBox";
import { addToast, Button, cn } from "@heroui/react";
import { OctagonXIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface TranslatableException {
    name: string;
    values: any;
    stack?: string;
}

export function ExceptionDisplay() {
    const { t } = useTranslation("common", { keyPrefix: "exceptions" });
    const [exceptions, setExceptions] = useState<unknown[]>([]);
    const [currentException, setCurrentException] = useState<unknown | null>(null);
    const [showSource, setShowSource] = useState(false);
    const [isOpen, setOpen] = useState(false);

    function handleException(ev: ErrorEvent | PromiseRejectionEvent) {
        // @ts-expect-error Unclear property definition in error events
        let e = ev.error || ev.reason || ev.message;

        if (!shouldSuppressError(e)) return;

        console.error("Received error event:");
        console.error(e);

        // For cancellation, we only show a toast
        if (isCancelled(e)) {
            addToast({
                color: "warning",
                title: t("types.cancelled")
            });
            return;
        }

        setExceptions([...exceptions, e]);
    }

    useEffect(() => {
        window.addEventListener("error", handleException);
        window.addEventListener("unhandledrejection", handleException);

        return () => {
            window.removeEventListener("error", handleException);
            window.removeEventListener("unhandledrejection", handleException);
        };
    }, []);

    useEffect(() => {
        if (!isOpen && exceptions.length > 0) {
            const exp = exceptions[0];
            setCurrentException(exp);
            setExceptions(exceptions.slice(1));
            setShowSource(false);
            setOpen(true);
        }
    }, [isOpen, exceptions]);

    if (!currentException) return null;

    let causeChain: TranslatableException[] = [];
    let ex: unknown = currentException;

    while (ex) {
        let type: string;
        let detail: unknown;
        let stack: string | undefined = undefined;

        if (isCheckedException(currentException)) {
            type = currentException.name;
            detail = currentException.props;
            stack = currentException.stack;
        } else {
            type = "unknown";
            detail = { error: currentException };
        }

        causeChain.push({
            name: type,
            values: detail,
            stack
        });

        if (typeof ex === "object" && "cause" in ex) {
            ex = ex.cause;
        } else {
            break;
        }
    }

    return <MessageBox
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        title={t("title")}
        icon={<OctagonXIcon size={36}/>}
        color="danger"
        footer={
            <div className="flex flex-col w-full gap-2">
                <p className="text-sm text-foreground-400 italic ml-auto">
                    <TipPicker tipKey="error"/>
                </p>
                <Button fullWidth color="primary" onPress={() => setOpen(false)}>
                    {t("btn")}
                </Button>
                {
                    !showSource &&
                    <Button fullWidth onPress={() => setShowSource(s => !s)}>
                        {t("show-source")}
                    </Button>
                }

            </div>
        }
    >
        <div className="flex flex-col gap-2">
            {
                causeChain.map((ex, i) =>
                    <p className="whitespace-pre-line text-wrap break-all" key={i}>
                        {
                            i !== 0 &&
                            <span className="text-sm text-foreground-400">{t("cause")} <br/></span>
                        }
                        {t(`types.${ex.name}`, { ...ex.values }) as any}
                    </p>
                )
            }

            {
                showSource &&
                <>
                    <div className="text-sm mt-2 text-foreground-400">{t("detail")}</div>

                    <div
                        className={cn(
                            "mt-2 w-full p-2 rounded-xs outline-solid outline-danger outline-2 outline-offset-4 text-sm",
                            "overflow-auto"
                        )}
                    >
                        <pre>
                            {
                                causeChain.map(ex => buildErrorMessage(ex.name, ex.values, ex.stack ?? ""))
                            }
                        </pre>
                    </div>
                </>
            }
        </div>
    </MessageBox>;
}

function buildErrorMessage(name: string, props: any, stack: string): string {
    const propLines = Object.entries(props).map(([k, v]) => `    [${k} = ${v}]`).join("\n");
    return [name, propLines, stack].filter(isTruthy).join("\n") + "\n";
}

function isCheckedException(e: unknown): e is SerializedException {
    return typeof e === "object" && e !== null && "_ALICORN_CHECKED_EXCEPTION" in e;
}

function isCancelled(e: unknown): boolean {
    if (isCheckedException(e)) {
        return e.name === "cancelled" || (!!e.cause && isCancelled(e.cause));
    } else {
        if (e instanceof DOMException) {
            return e.name === "AbortError";
        } else {
            const se = String(e).toLowerCase();
            return se.includes("aborterror") || se.includes("cancelled");
        }
    }
}

function shouldSuppressError(e: unknown): boolean {
    // https://github.com/inokawa/virtua?tab=readme-ov-file#what-is-resizeobserver-loop-completed-with-undelivered-notifications-error
    return e !== "ResizeObserver loop completed with undelivered notifications.";
}
