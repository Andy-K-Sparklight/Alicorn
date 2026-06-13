import { Button, Popover } from "@heroui/react";
import { ArrowRightIcon } from "lucide-react";
import { type ComponentProps, type PropsWithChildren, useState } from "react";

interface ConfirmPopupProps {
    title: string;
    sub: string;
    btnText: string;
    placement?: ComponentProps<typeof Popover.Content>["placement"];
    onConfirm: () => void;
    color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
}

function colorToButtonVariant(
    color: ConfirmPopupProps["color"],
): Parameters<typeof Button>[0]["variant"] {
    switch (color) {
        case "danger":
            return "danger";
        case "primary":
            return "primary";
        case "secondary":
            return "secondary";
        default:
            return undefined;
    }
}

export function ConfirmPopup({
    title,
    placement,
    sub,
    btnText,
    children,
    onConfirm,
    color,
}: PropsWithChildren<ConfirmPopupProps>) {
    const [isOpen, setOpen] = useState(false);

    function handlePress() {
        setOpen(false);
        onConfirm();
    }

    return (
        <Popover isOpen={isOpen} onOpenChange={setOpen}>
            <Popover.Trigger>{children}</Popover.Trigger>
            <Popover.Content placement={placement}>
                <Popover.Dialog>
                    <div className="flex flex-col gap-1 py-2 px-4 items-center">
                        <div className="text-lg font-bold">{title}</div>

                        <div className="text-sm text-muted whitespace-pre-line text-center">
                            {sub}
                        </div>
                        <Button
                            size="sm"
                            variant={colorToButtonVariant(color)}
                            onPress={handlePress}
                        >
                            <ArrowRightIcon />
                            {btnText}
                        </Button>
                    </div>
                </Popover.Dialog>
            </Popover.Content>
        </Popover>
    );
}
