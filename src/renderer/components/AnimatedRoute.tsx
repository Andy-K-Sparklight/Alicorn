import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { useRoute } from "wouter";

interface AnimatedRouteProps {
    path: string;
    component: React.ComponentType<{ params: any }>;
}

export type PropsWithParams<T> = { params: T }

export function AnimatedRoute({ path, component }: AnimatedRouteProps) {
    const [matched, params] = useRoute(path);

    const Component = component;

    return <AnimatePresence>
        {
            matched &&
            <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0, translateX: "3%", zIndex: 10 }}
                animate={{ opacity: 1, translateX: "0%", zIndex: 0 }}
                exit={{ opacity: 0, translateX: "-3%", zIndex: -10 }}
                transition={{
                    duration: 0.8,
                    type: "spring"
                }}
            >
                <Component params={params}/>
            </motion.div>
        }
    </AnimatePresence>;
}
