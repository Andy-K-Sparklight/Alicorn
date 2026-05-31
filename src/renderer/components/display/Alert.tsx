import { CloseButton, Alert as RawAlert } from "@heroui/react";
import type { ReactNode } from "react";

interface AlertProps {
    title?: ReactNode;
    children?: ReactNode;
    className?: string;
    status?: "default" | "accent" | "success" | "warning" | "danger";
    endContent?: ReactNode;
    isClosable?: boolean;
    onClose?: () => void;
}

/**
 * Local compatibility wrapper while the app migrates from v2 Alert props.
 */
export function Alert({
    title,
    children,
    className,
    status,
    endContent,
    isClosable,
    onClose,
}: AlertProps) {
    return (
        <RawAlert status={status} className={className}>
            <RawAlert.Indicator />

            <RawAlert.Content>
                {title && <RawAlert.Title className="font-bold">{title}</RawAlert.Title>}
                {children && <RawAlert.Description>{children}</RawAlert.Description>}
            </RawAlert.Content>
            {endContent && <div className="ml-auto">{endContent}</div>}
            {isClosable && <CloseButton onPress={onClose} />}
        </RawAlert>
    );
}
