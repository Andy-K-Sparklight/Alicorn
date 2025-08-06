import { Radio } from "@heroui/react";

export function CardRadio(props: Parameters<typeof Radio>[0]) {
    const { classNames, ...rest } = props;

    return <Radio
        classNames={{
            base: `bg-content1 m-0 rounded-xl p-3 flex-row-reverse duration-100 max-w-full border-transparent
            data-[selected=true]:border-primary border-2`,
            labelWrapper: "mr-auto",
            ...classNames
        }}
        {...rest}
    />;
}
