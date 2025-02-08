import type { OverlayPlacement } from "@heroui/aria-utils";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import { ArrowRightIcon, CircleHelpIcon } from "lucide-react";
import React, { type PropsWithChildren, useState } from "react";

interface ConfirmPopupProps {
    title: string;
    sub: string;
    btnText: string;
    placement?: OverlayPlacement;
    onConfirm: () => void;
    color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
}

export function ConfirmPopup(
    {
        title,
        placement,
        sub,
        btnText,
        children,
        onConfirm,
        color
    }
    : PropsWithChildren<ConfirmPopupProps>
) {
    const [isOpen, setOpen] = useState(false);

    function handlePress() {
        setOpen(false);
        onConfirm();
    }

    return <Popover placement={placement} color="foreground" isOpen={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger>
            {children}
        </PopoverTrigger>
        <PopoverContent>
            <div className="flex flex-col gap-2 py-2 px-4 items-center">
                <div className="flex items-center gap-2">
                    <CircleHelpIcon/>
                    <div className="text-lg font-bold">{title}</div>
                </div>

                <div className="text-sm text-foreground-400">{sub}</div>
                <Button
                    size="sm"
                    color={color}
                    startContent={<ArrowRightIcon/>}
                    onPress={handlePress}
                >
                    {btnText}
                </Button>
            </div>
        </PopoverContent>
    </Popover>;
}
