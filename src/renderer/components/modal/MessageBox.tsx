import { cn, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import React, { type PropsWithChildren } from "react";

interface MessageBoxProps extends PropsWithChildren {
    title: string;
    icon: React.ReactNode;
    color: "success" | "info" | "warning" | "danger";
    footer?: React.ReactNode;
    isOpen?: boolean;
    defaultOpen?: boolean;
    onClose?: () => void;
}

export function MessageBox({ title, icon, color, footer, children, isOpen, defaultOpen, onClose }: MessageBoxProps) {
    const colors = {
        success: "text-success-500 bg-success-100",
        info: "text-primary-500 bg-primary-100",
        warning: "text-warning-500 bg-warning-100",
        danger: "text-danger-500 bg-danger-100"
    } as const;

    return <Modal
        isOpen={isOpen} className="max-w-[80%] w-auto min-w-[40%]" onClose={onClose} defaultOpen={defaultOpen}
    >
        <ModalContent>
            <ModalHeader>{title}</ModalHeader>
            <ModalBody>
                <div className="w-full flex items-center gap-8 px-4">
                    <div className={cn("flex p-4 items-center rounded-full shrink-0", colors[color])}>
                        {icon}
                    </div>

                    <div className="h-full grow min-w-0">
                        {children}
                    </div>
                </div>
            </ModalBody>
            <ModalFooter>
                {footer}
            </ModalFooter>
        </ModalContent>
    </Modal>;
}
