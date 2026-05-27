"use client";
import { Device } from "../Room/DeviceCard";
import ACsController from "./ACsController";
import SmartSchedule from "./SmartSchedule";
import { SmartSwitchController } from "./SmartSwitchController";
import TVsController from "./TVsController";


export default function DeviceControll({ device }: { device: Device }) {
    switch (device.type) {
        case "TV":
            return <TVsController data={device} />;
        case "RELAY":
            return <SmartSwitchController data={device} />;
        case "SMART_SCHEDULE":
            return <SmartSchedule />;
        default:
            return <ACsController data={device} />;
    }
}
