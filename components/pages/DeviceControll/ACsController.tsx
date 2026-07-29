"use client";

import { useEffect, useMemo, useState } from "react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/libs/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChevronDown,
  ChevronUp,
  PowerIcon,
  Moon02Icon,
  FastWindIcon,
  Fan01Icon,
} from "@hugeicons/core-free-icons";
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

type ACState = {
  power: boolean;
  temperature: number;
  fanSpeed: number; // 0-5, gửi y nguyên xuống backend
  swing: number; // 0-7 (raw value backend), gửi y nguyên xuống backend
  mode: number; // 0-4, gửi y nguyên xuống backend
};

const DEFAULT_AC_STATE: ACState = {
  power: true,
  temperature: 24,
  fanSpeed: 0,
  swing: 0,
  mode: 1, // Cool
};

// mode: 0 Auto, 1 Cool, 2 Heat, 3 Dry, 4 Fan
const MODES = [
  { value: 0, label: "Tự động" },
  { value: 1, label: "Làm mát" },
  { value: 2, label: "Sưởi ấm" },
  { value: 3, label: "Hút ẩm" },
  { value: 4, label: "Quạt gió" },
] as const;

// fan: 0 Auto,1 Low,2 Medium,3 High,4 Min,5 Max -> UI cycle đi đúng thứ tự số
const FAN_SPEED_MAX = 5;
const FAN_SPEED_LABEL: Record<number, string> = {
  0: "Tự động",
  1: "Thấp",
  2: "Trung bình",
  3: "Cao",
  4: "Thấp nhất",
  5: "Cao nhất",
};

// swing raw: 0 Off,1 Auto,2 Highest,3 High,4 Middle,5 Low,6 Lowest,7 UpperMiddle
// UI cycle đi theo thứ tự hợp lý: Off -> Auto -> Lowest -> Low -> Middle -> High -> Highest
const SWING_UI_ORDER = [0, 1, 6, 5, 4, 3, 2] as const;
const SWING_LABEL: Record<number, string> = {
  0: "Tắt",
  1: "Tự động",
  2: "Hướng Cao nhất",
  3: "Hướng Cao",
  4: "Hướng Giữa",
  5: "Hướng Thấp",
  6: "Hướng Thấp nhất",
  7: "Hướng Giữa trên",
};

export default function ACsController({ data, roomName }: { roomName: string; data: Device }) {
  const { send } = useTransport();

  const storageKey = useMemo(() => `ac-state:${roomName}:${data.id}`, [roomName, data.id]);
  const sleepStorageKey = useMemo(() => `ac-sleep:${roomName}:${data.id}`, [roomName, data.id]);

  const [power, setPower] = useState(DEFAULT_AC_STATE.power);
  const [temperature, setTemperature] = useState(DEFAULT_AC_STATE.temperature);
  const [fanSpeed, setFanSpeed] = useState(DEFAULT_AC_STATE.fanSpeed);
  const [swing, setSwing] = useState(DEFAULT_AC_STATE.swing);
  const [mode, setMode] = useState<number>(DEFAULT_AC_STATE.mode);

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
    setSwing(savedState.swing ?? DEFAULT_AC_STATE.swing);
    setMode(savedState.mode);
  }, [storageKey]);

  useEffect(() => {
    const savedSleep = LocalStorage.get<SleepConfig>(sleepStorageKey, DEFAULT_SLEEP_CONFIG);
    if (!savedSleep) return;
    setSleepConfig(savedSleep);
  }, [sleepStorageKey]);

  const sendFullState = async (overrideStates: Partial<ACState> = {}) => {
    const nextState: ACState = {
      power: overrideStates.power ?? power,
      temperature: overrideStates.temperature ?? temperature,
      mode: overrideStates.mode ?? mode,
      fanSpeed: overrideStates.fanSpeed ?? fanSpeed,
      swing: overrideStates.swing ?? swing,
    };

    LocalStorage.set(storageKey, nextState);

    const payload = {
      type: data.type,
      deviceName: data.name,
      brand: data.brand || "UNKNOWN",
      action: {
        power: nextState.power ? "OFF" : "ON",
        temp: nextState.temperature,
        mode: nextState.mode,
        fan: nextState.fanSpeed,
        swing: nextState.swing,
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

  const changeMode = async (nextMode: number) => {
    setMode(nextMode);
    await sendFullState({ mode: nextMode });
  };

  const cycleFanSpeed = async () => {
    const nextFanSpeed = fanSpeed >= FAN_SPEED_MAX ? 0 : fanSpeed + 1;
    setFanSpeed(nextFanSpeed);
    await sendFullState({ fanSpeed: nextFanSpeed });
  };

  const cycleSwing = async () => {
    const currentIndex = SWING_UI_ORDER.indexOf(swing as (typeof SWING_UI_ORDER)[number]);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % SWING_UI_ORDER.length;
    const nextSwing = SWING_UI_ORDER[nextIndex];
    setSwing(nextSwing);
    await sendFullState({ swing: nextSwing });
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
    const nextConfig: SleepConfig = { sleep: true, configured: true, ...values };
    setSleepConfig(nextConfig);
    setSleepSetupOpen(false);
    await sendSleepState(nextConfig);
  };

  const handleToggleSleep = async (checked: boolean) => {
    if (checked) {
      if (!sleepConfig.configured) {
        setSleepConfirmOpen(true); // Chưa tự cấu hình lần nào -> luôn hỏi lại
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
      configured: false, // vẫn chưa tự set -> lần bật sau vẫn phải hỏi lại
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
                <div className="text-sm text-muted-foreground">Nhiệt độ hiện tại</div>
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

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-background/60 px-4 py-3">
              <div className="flex items-start gap-2">
                <HugeiconsIcon icon={FastWindIcon} size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Hướng quạt</div>
                  <div className="min-h-[2.5rem] text-sm font-semibold leading-tight">{SWING_LABEL[swing]}</div>
                </div>
              </div>
              <div className="flex items-start gap-2 border-l pl-3">
                <HugeiconsIcon icon={Fan01Icon} size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">Tốc độ quạt</div>
                  <div className="min-h-[2.5rem] text-sm font-semibold leading-tight">{FAN_SPEED_LABEL[fanSpeed]}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3" data-tour="ac-mode">
            <div className="text-sm font-medium">Chế độ</div>
            <div className="grid grid-cols-5 gap-2">
              {MODES.map((item) => {
                const active = mode === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => void changeMode(item.value)}
                    className={cn(
                      "flex h-16 items-center justify-center rounded-2xl border text-xs font-medium transition sm:text-sm",
                      active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3" data-tour="ac-quick">
            <Button
              variant="outline"
              className="h-16 rounded-2xl"
              onClick={() => void cycleSwing()}
            >
              <span className="text-sm font-medium">Hướng quạt</span>
            </Button>

            <Button
              variant="outline"
              className="h-16 rounded-2xl"
              onClick={() => void cycleFanSpeed()}
            >
              <span className="text-sm font-medium">Tốc độ quạt</span>
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
        onOpenSetup={() => {
          setSleepConfirmOpen(false);
          setSleepSetupOpen(true);
        }}
      />
    </CardContent>
  );
}