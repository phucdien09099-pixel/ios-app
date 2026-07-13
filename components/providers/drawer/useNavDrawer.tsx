import { useDrawer } from "./DrawerProvider";

export function useNavDrawer() {
    const { push, replaceTop, pop, reset } = useDrawer();

    return {
        open: push,
        replace: replaceTop,
        back: pop,
        closeAll: reset,
    };
}
