import type { ExceptionProps, ExceptionType } from "@/main/util/exception";
import { TipPicker } from "@components/TipPicker";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function ExceptionDisplay() {
    const { t } = useTranslation("common", { keyPrefix: "exceptions" });
    const [exceptions, setExceptions] = useState<unknown[]>([]);
    const [currentException, setCurrentException] = useState<unknown | null>(null);
    const [isOpen, setOpen] = useState(false);

    function handleException(ev: ErrorEvent | PromiseRejectionEvent) {
        let e: unknown;

        if ("error" in ev) {
            e = ev.error;
        } else {
            e = ev.reason;
        }

        e = restoreError(e);

        // For cancellation, we only show a toast
        if (isKnownException(e) && (e as ExceptionProps<any>).type === "cancelled" || String(e).includes("AbortError")) {
            toast.warning(t("types.cancelled"));
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
        detail = { error: String(currentException) };
    }

    return <Modal isOpen={isOpen} onOpenChange={setOpen} size="xl">
        <ModalContent>

            <ModalHeader className="flex flex-col gap-1">
                {t("title")}
            </ModalHeader>
            <ModalBody>
                {
                    !!detail.error &&
                    <>
                        <p className="whitespace-pre-line">
                            {t(`types.${type}`, { ...detail })}
                        </p>

                        <div className="text-sm mt-2 text-foreground-400">{t("detail")}</div>

                        <div className="p-4 rounded-2xl border-solid border-2 border-danger text-sm">
                                <pre className="text-wrap">
                                    {String(detail.error)}
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
        console.log("Stringify: ");
        console.log(se);

        // Restore the error previously serialized
        if (se.includes("\0\0\0")) {
            const json = se.split("\0\0\0")[1];
            return JSON.parse(json);
        }
    } catch {}

    return e;
}
