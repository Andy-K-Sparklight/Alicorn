import type { ExceptionProps, ExceptionType } from "@/main/util/exception";
import { TipPicker } from "@components/TipPicker";
import { addToast, Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function ExceptionDisplay() {
    const { t } = useTranslation("common", { keyPrefix: "exceptions" });
    const [exceptions, setExceptions] = useState<unknown[]>([]);
    const [currentException, setCurrentException] = useState<unknown | null>(null);
    const [isOpen, setOpen] = useState(false);

    function handleException(ev: ErrorEvent | PromiseRejectionEvent) {
        // @ts-expect-error Unclear property definition in error events
        let e = ev.error || ev.reason || ev.message;

        if (!shouldSuppressError(e)) return;

        console.error("Received error event:");
        console.error(e);

        e = restoreError(e);

        // For cancellation, we only show a toast
        if (isKnownException(e) && (e as ExceptionProps<any>).type === "cancelled" || String(e).includes("AbortError")) {
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
            setOpen(true);
        }
    }, [isOpen, exceptions]);

    if (!currentException) return null;

    let type: keyof ExceptionType;
    let detail: ExceptionType[keyof ExceptionType] & { error?: unknown };

    if (isKnownException(currentException)) {
        const exp = currentException as ExceptionProps<any>;
        type = exp.type;
        detail = exp.detail;
    } else {
        type = "unknown";
        detail = { error: currentException };
    }

    return <Modal isOpen={isOpen} onOpenChange={setOpen} size="xl">
        <ModalContent>

            <ModalHeader className="flex flex-col gap-1">
                {t("title")}
            </ModalHeader>
            <ModalBody>
                <p className="whitespace-pre-line text-wrap break-all">
                    {t(`types.${type}`, { ...detail })}
                </p>

                {
                    !!detail.error &&
                    <>
                        <div className="text-sm mt-2 text-foreground-400">{t("detail")}</div>

                        <div className="p-4 rounded-2xl border-solid border-2 border-danger text-sm">
                            <pre className="text-wrap break-all">
                                {
                                    typeof detail.error === "object" && "stack" in detail.error ?
                                        String(detail.error.stack) : String(detail.error)
                                }
                            </pre>
                        </div>
                    </>
                }
            </ModalBody>
            <ModalFooter>
                <div className="flex flex-col w-full gap-2">
                    <p className="text-sm text-foreground-400 italic ml-auto">
                        <TipPicker tipKey="error"/>
                    </p>
                    <Button fullWidth color="primary" onPress={() => setOpen(false)}>
                        {t("btn")}
                    </Button>
                </div>
            </ModalFooter>
        </ModalContent>
    </Modal>;
}

function isKnownException(e: unknown): boolean {
    return typeof e === "object" && e !== null && "ALICORN_EXCEPTION" in e;
}

function restoreError(e: unknown) {
    try {
        const se = String(e);

        // Restore the error previously serialized
        if (se.includes("\x00\x01\x02") && se.includes("ALICORN_EXCEPTION")) {
            const json = se.split("\x00\x01\x02")[1];
            return JSON.parse(json);
        }
    } catch {}

    return e;
}

function shouldSuppressError(e: unknown): boolean {
    // https://github.com/inokawa/virtua?tab=readme-ov-file#what-is-resizeobserver-loop-completed-with-undelivered-notifications-error
    return e !== "ResizeObserver loop completed with undelivered notifications.";
}
