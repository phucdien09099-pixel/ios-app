export class ACController {
    private isPowerOn = false;

    private temperature = 24;

    private mode:
        | "cool"
        | "heat"
        | "dry"
        | "fan"
        | "auto" = "cool";

    private fanSpeed:
        | "auto"
        | "low"
        | "medium"
        | "high" = "auto";

    private swing = false;

    powerToggle() {
        this.isPowerOn = !this.isPowerOn;

        console.log(
            this.isPowerOn
                ? "Máy lạnh đã bật"
                : "Máy lạnh đã tắt"
        );
    }

    setTemperature(temp: number) {
        if (!this.isPowerOn) {
            console.log("Máy lạnh đang tắt");
            return;
        }

        this.temperature = Math.max(16, Math.min(30, temp));

        console.log(
            `Nhiệt độ: ${this.temperature}°C`
        );
    }

    temperatureUp(step = 1) {
        this.setTemperature(
            this.temperature + step
        );
    }

    temperatureDown(step = 1) {
        this.setTemperature(
            this.temperature - step
        );
    }

    setMode(
        mode:
            | "cool"
            | "heat"
            | "dry"
            | "fan"
            | "auto"
    ) {
        if (!this.isPowerOn) {
            console.log("Máy lạnh đang tắt");
            return;
        }

        this.mode = mode;

        console.log(`Mode: ${this.mode}`);
    }

    setFanSpeed(
        speed:
            | "auto"
            | "low"
            | "medium"
            | "high"
    ) {
        if (!this.isPowerOn) {
            console.log("Máy lạnh đang tắt");
            return;
        }

        this.fanSpeed = speed;

        console.log(
            `Fan Speed: ${this.fanSpeed}`
        );
    }

    toggleSwing() {
        if (!this.isPowerOn) {
            console.log("Máy lạnh đang tắt");
            return;
        }

        this.swing = !this.swing;

        console.log(
            this.swing
                ? "Swing bật"
                : "Swing tắt"
        );
    }

    getStatus() {
        return {
            power: this.isPowerOn,
            temperature: this.temperature,
            mode: this.mode,
            fanSpeed: this.fanSpeed,
            swing: this.swing,
        };
    }
}