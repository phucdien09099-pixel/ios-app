import { useDrawer } from "./DrawerProvider";

export function useNavDrawer() {
    const { push, pop, reset } = useDrawer();

    return {
        open: push,
        back: pop,
        closeAll: reset,
    };
}