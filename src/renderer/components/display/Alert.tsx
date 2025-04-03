import { Alert as RawAlert } from "@heroui/react";
import { useEffect, useRef } from "react";

type AlertProps = Parameters<typeof RawAlert>[0];

/**
 * A patch on the alert component to remove the title.
 */
export function Alert(props: AlertProps) {
    const ref = useRef<HTMLDivElement | null>(null);
    const { classNames, ...rest } = props;

    useEffect(() => {
        if (ref.current) {
            ref.current.removeAttribute("title");
        }
    }, [ref.current]);

    return <RawAlert
        ref={ref}
        classNames={{
            title: "font-bold",
            ...classNames
        }}
        {...rest}
    />;
}
