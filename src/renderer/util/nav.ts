import { useLocation } from "wouter";

export function useNav() {
    const [, nav] = useLocation();
    return nav;
}
