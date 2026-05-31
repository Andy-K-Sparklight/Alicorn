import { cn, Radio } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

type CardRadioProps = Omit<ComponentProps<typeof Radio>, "children"> & {
    children?: ReactNode;
};

export function CardRadio({ className, children, ...rest }: CardRadioProps) {
    return (
        <Radio
            className={cn(
                "m-0 max-w-full flex-row-reverse rounded-xl border-2 border-transparent bg-surface p-3 duration-100 data-[selected=true]:border-accent",
                className,
            )}
            {...rest}
        >
            <Radio.Control>
                <Radio.Indicator />
            </Radio.Control>
            <Radio.Content className="mr-auto">{children}</Radio.Content>
        </Radio>
    );
}
