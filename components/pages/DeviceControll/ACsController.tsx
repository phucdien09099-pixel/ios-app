"use client";

import { useEffect, useMemo, useState } from "react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/libs/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronDown, ChevronUp, PowerIcon, Moon02Icon } from "@hugeicons/core-free-icons";
import { Device } from "../Room/DeviceCard";
import { useTransport } from "@/components/providers/transport/TransportProvider";
import {
  pauseTourForDeviceDrawer,
  resumeTourAfterDeviceDrawer,
} from "@/components/onboarding/tours/afterAddDeviceTour";
import { LocalStorage } from "@/libs/local-storage";
import SleepModeSetupDrawer, {
  SleepConfirmDefaultDrawer,
  type SleepConfig,
  type SleepTarget,
  DEFAULT_SLEEP_CONFIG,
  SLEEP_TARGETS,
  SLEEP_TARGET_LABEL,
} from "./SleepModeSetupDrawer";

export type { SleepConfig, SleepTarget };

type ModeAC = "COOL" | "DRY" | "FAN";

type ACState = {
  power: boolean;
  temperature: number;
  fanSpeed: number;
  mode: ModeAC;
};

const DEFAULT_AC_STATE: ACState = {
  power: true,
  temperature: 24,
  fanSpeed: 0,
  mode: "COOL",
};

const MODES = [
  { key: "COOL", label: "Cool" },
  { key: "DRY", label: "Dry" },
  { key: "FAN", label: "Fan" },
] as const;

export default function ACsController({ data, roomName }: { roomName: string; data: Device }) {
  const { send } = useTransport();

  const storageKey = useMemo(() => `ac-state:${roomName}:${data.id}`, [roomName, data.id]);
  const sleepStorageKey = useMemo(() => `ac-sleep:${roomName}:${data.id}`, [roomName, data.id]);

  const [power, setPower] = useState(DEFAULT_AC_STATE.power);
  const [temperature, setTemperature] = useState(DEFAULT_AC_STATE.temperature);
  const [fanSpeed, setFanSpeed] = useState(DEFAULT_AC_STATE.fanSpeed);
  const [mode, setMode] = useState<ModeAC>(DEFAULT_AC_STATE.mode);

  const [sleepConfig, setSleepConfig] = useState<SleepConfig>(DEFAULT_SLEEP_CONFIG);
  const [sleepSetupOpen, setSleepSetupOpen] = useState(false);
  const [sleepConfirmOpen, setSleepConfirmOpen] = useState(false);

  useEffect(() => {
    pauseTourForDeviceDrawer();
    return () => resumeTourAfterDeviceDrawer();
  }, []);

  useEffect(() => {
    const savedState = LocalStorage.get<ACState>(storageKey, DEFAULT_AC_STATE);
    if (!savedState) return;

    setPower(savedState.power);
    setTemperature(savedState.temperature);
    setFanSpeed(savedState.fanSpeed);
    setMode(savedState.mode);
  }, [storageKey]);

  useEffect(() => {
    const savedSleep = LocalStorage.get<SleepConfig>(sleepStorageKey, DEFAULT_SLEEP_CONFIG);
    if (!savedSleep) return;
    setSleepConfig(savedSleep);
  }, [sleepStorageKey]);

  const getModeNumber = (currentMode: ModeAC): number => {
    switch (currentMode) {
      case "COOL":
        return 1;
      case "DRY":
        return 2;
      case "FAN":
      default:
        return 0;
    }
  };

  const sendFullState = async (overrideStates: Partial<ACState> = {}) => {
    const nextState: ACState = {
      power: overrideStates.power ?? power,
      temperature: overrideStates.temperature ?? temperature,
      mode: overrideStates.mode ?? mode,
      fanSpeed: overrideStates.fanSpeed ?? fanSpeed,
    };

    LocalStorage.set(storageKey, nextState);

    const payload = {
      type: data.type,
      deviceName: data.name,
      brand: data.brand || "UNKNOWN",
      action: {
        power: nextState.power ? "OFF" : "ON",
        temp: nextState.temperature,
        mode: getModeNumber(nextState.mode),
        fan: nextState.fanSpeed,
      },
    };

    console.log("Sending Full State Payload:", payload);
    await send(payload, `device/${roomName}/control/set`);
  };

  const changePower = async () => {
    const nextPower = !power;
    setPower(nextPower);
    await sendFullState({ power: nextPower });
  };

  const changeTemperature = async (delta: number) => {
    const nextTemperature = Math.min(30, Math.max(16, temperature + delta));
    if (nextTemperature === temperature) return;

    setTemperature(nextTemperature);
    await sendFullState({ temperature: nextTemperature });
  };

  const changeFanSpeed = async (nextFanSpeed: number) => {
    setFanSpeed(nextFanSpeed);
    await sendFullState({ fanSpeed: nextFanSpeed });
  };

  const changeMode = async (nextMode: ModeAC) => {
    setMode(nextMode);
    await sendFullState({ mode: nextMode });
  };

  // ============== Sleep mode ==============

  const sendSleepState = async (nextConfig: SleepConfig) => {
    LocalStorage.set(sleepStorageKey, nextConfig);

    const payload = {
      type: data.type,
      deviceName: data.name,
      brand: data.brand || "UNKNOWN",
      action: {
        power: power ? "OFF" : "ON",
        temp: nextConfig.temperature,
        mode: 3,
        fan: fanSpeed,
        sleep: nextConfig.sleep,
        wakeTime: nextConfig.wakeTime,
        target: nextConfig.target ? SLEEP_TARGET_LABEL[nextConfig.target] : null,
      },
    };

    console.log("Sending Sleep State Payload:", payload);
    await send(payload, `device/${roomName}/control/set`);
  };

  const handleSaveSleepSetup = async (values: {
    wakeTime: string;
    target: SleepTarget;
    temperature: number;
  }) => {
    const nextConfig: SleepConfig = { sleep: true, ...values };
    setSleepConfig(nextConfig);
    setSleepSetupOpen(false);
    await sendSleepState(nextConfig);
  };

  const handleToggleSleep = async (checked: boolean) => {
    if (checked) {
      if (!sleepConfig.target) {
        setSleepConfirmOpen(true); // Chưa từng thiết lập -> hỏi xác nhận chạy mặc định
        return;
      }

      const nextConfig: SleepConfig = { ...sleepConfig, sleep: true };
      setSleepConfig(nextConfig);
      await sendSleepState(nextConfig);
      return;
    }

    // Tắt switch -> tắt thẳng, không hỏi gì thêm
    const nextConfig: SleepConfig = { ...sleepConfig, sleep: false };
    setSleepConfig(nextConfig);
    await sendSleepState(nextConfig);
  };

  const handleConfirmDefaultSleep = async () => {
    const defaultTarget = SLEEP_TARGETS.find((item) => item.key === "adult")!;
    const nextConfig: SleepConfig = {
      sleep: true,
      wakeTime: DEFAULT_SLEEP_CONFIG.wakeTime,
      target: defaultTarget.key,
      temperature: defaultTarget.recommendedTemp,
    };

    setSleepConfig(nextConfig);
    setSleepConfirmOpen(false);
    await sendSleepState(nextConfig);
  };

  const sleepDescription = sleepConfig.target
    ? `Thức ${sleepConfig.wakeTime} · ${SLEEP_TARGET_LABEL[sleepConfig.target]} · ${sleepConfig.temperature}°C`
    : "Chưa thiết lập — nhấn để cấu hình";

  return (
    <CardContent className="p-4 pb-28 md:p-6 md:pb-28">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="flex items-center justify-between" data-tour="ac-power">
            <div>
              <h1 className="text-xl font-semibold">{data.name}</h1>
              <p className="text-sm text-muted-foreground">Điều hoà</p>
            </div>

            <Button
              size="icon"
              className={cn(
                "size-14 rounded-2xl",
                power ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
              )}
              onClick={changePower}
            >
              <HugeiconsIcon icon={PowerIcon} size={26} />
            </Button>
          </div>

          <div className="rounded-3xl border bg-muted/30 p-6" data-tour="ac-temp">
            <div className="flex items-center justify-between">
              <Button
                size="icon"
                variant="outline"
                className="size-14 rounded-2xl"
                disabled={temperature <= 16}
                onClick={() => void changeTemperature(-1)}
              >
                <HugeiconsIcon icon={ChevronDown} />
              </Button>

              <div className="text-center">
                <div className="text-6xl font-bold lg:text-7xl">{temperature}°</div>
                <div className="text-sm text-muted-foreground">Temperature</div>
              </div>

              <Button
                size="icon"
                variant="outline"
                className="size-14 rounded-2xl"
                disabled={temperature >= 30}
                onClick={() => void changeTemperature(1)}
              >
                <HugeiconsIcon icon={ChevronUp} />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3" data-tour="ac-mode">
            <div className="text-sm font-medium">Mode</div>
            <div className="grid grid-cols-3 gap-3">
              {MODES.map((item) => {
                const active = mode === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => void changeMode(item.key)}
                    className={cn(
                      "flex h-24 items-center justify-center rounded-2xl border text-sm font-medium transition",
                      active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3" data-tour="ac-fan">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Fan Speed</span>
              <span className="text-xs text-muted-foreground">
                {fanSpeed === 0 ? "Auto" : `Level ${fanSpeed}`}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => void changeFanSpeed(level)}
                  className={cn(
                    "h-14 rounded-2xl border text-sm font-medium transition",
                    fanSpeed === level ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  {level === 0 ? "Auto" : level}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3" data-tour="ac-quick">
            <Button variant="outline" className="h-14 rounded-2xl" onClick={() => void sendFullState()}>
              Swing
            </Button>
            <Button variant="outline" className="h-14 rounded-2xl" onClick={() => void sendFullState()}>
              Timer
            </Button>
          </div>
        </div>
      </div>

      {/* Chế độ ngủ ngon */}
      <div className="mt-6 flex items-center gap-4 rounded-3xl border bg-muted/30 p-5" data-tour="ac-sleep">
        <button
          type="button"
          onClick={() => setSleepSetupOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-4 text-left"
        >
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <HugeiconsIcon icon={Moon02Icon} size={26} />
          </div>
          <div className="min-w-0">
            <div className="text-base font-semibold">Sleep</div>
            <div className="text-sm text-muted-foreground truncate">{sleepDescription}</div>
          </div>
        </button>

        <Switch
          className="shrink-0"
          checked={sleepConfig.sleep}
          onCheckedChange={(checked) => void handleToggleSleep(checked)}
        />
      </div>

      <SleepModeSetupDrawer
        open={sleepSetupOpen}
        onOpenChange={setSleepSetupOpen}
        initial={sleepConfig}
        onSave={(values) => void handleSaveSleepSetup(values)}
      />

      <SleepConfirmDefaultDrawer
        open={sleepConfirmOpen}
        onOpenChange={setSleepConfirmOpen}
        onConfirm={() => void handleConfirmDefaultSleep()}
      />
    </CardContent>
  );
}