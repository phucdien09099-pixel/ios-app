import { useNavDrawer } from "@/components/providers/drawer/useNavDrawer";

export function DeviceSettings() {
    const { open } = useNavDrawer();

    return (
        <div>
            <button
                onClick={() =>
                    open({
                        id: "advanced",
                        title: "Advanced",
                        element: <>Hello</>,
                    })
                }
            >
                Advanced
            </button>
        </div>
    );
}