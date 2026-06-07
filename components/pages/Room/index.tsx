"use client"
import { Room } from "@/db/types/room";
import DeviceCard from "./DeviceCard";
import { EmptyDevices } from "./EmptyDevice";
import AppPullToRefresh from "@/components/common/AppPull2Refresh";
import { useEffect, useState } from "react";
import { deviceRepo } from "@/db/repository/DeviceRepository";
import { Device } from "@/db/types/devive";
import BottomNavBar from "./BottomNavBar";

export default function DevicesRoom({ roomId, onLoad, roomName }: { roomName: string, roomId: string, onLoad: any }) {

    const [devices, setDevice] = useState<Device[]>();

    const load = async () => {
        const data = await deviceRepo.getByRoom(roomId);
        setDevice(data)
    }

    useEffect(() => {
        load();
    }, [])

    return (
        <AppPullToRefresh onRefresh={load}>
            {devices && devices.length > 0
                ? (
                    <>
                        <div className="m-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 pb-24">
                            {devices.map((d) => (
                                <DeviceCard roomName={roomName} onDeleted={load} key={d.id} device={d as any} />
                            ))}
                        </div>
                        <BottomNavBar deviceId={roomId} />
                    </>
                )
                : (<EmptyDevices roomId={roomId} roomName={roomName} />)
            }
        </AppPullToRefresh >
    )
}
