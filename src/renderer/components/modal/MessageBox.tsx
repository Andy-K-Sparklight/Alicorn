import { cn, Modal } from "@heroui/react";
import type React from "react";
import type { PropsWithChildren } from "react";

interface MessageBoxProps extends PropsWithChildren {
    title: string;
    icon: React.ReactNode;
    color: "success" | "info" | "warning" | "danger";
    footer?: React.ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
}

export function MessageBox({
    title,
    icon,
    color,
    footer,
    children,
    isOpen,
    onClose,
}: MessageBoxProps) {
    const colors = {
        success: "text-success bg-success-soft",
        info: "text-accent bg-accent-soft",
        warning: "text-warning bg-warning-soft",
        danger: "text-danger bg-danger-soft",
    } as const;

    function handleOpenChange(open: boolean) {
        if (!open) {
            onClose?.();
        }
    }

    return (
        <Modal>
            <Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
                <Modal.Container className="max-w-[80%] w-auto min-w-[40%]">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Modal.Heading>{title}</Modal.Heading>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="w-full flex items-center gap-8 px-4">
                                <div
                                    className={cn(
                                        "flex p-4 items-center rounded-full shrink-0",
                                        colors[color],
                                    )}
                                >
                                    {icon}
                                </div>

                                <div className="h-full grow min-w-0">{children}</div>
                            </div>
                        </Modal.Body>
                        <Modal.Footer>{footer}</Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    );
}
