export class TVController {
    private isPowerOn = false;
    private volume = 10;
    private channel = 1;

    powerToggle() {
        this.isPowerOn = !this.isPowerOn;

        console.log(
            this.isPowerOn
                ? "TV đã bật"
                : "TV đã tắt"
        );
    }

    setVolume(volume: number) {
        if (!this.isPowerOn) {
            console.log("TV đang tắt");
            return;
        }

        this.volume = Math.max(0, Math.min(100, volume));

        console.log(`Âm lượng: ${this.volume}`);
    }

    volumeUp(step = 1) {
        this.setVolume(this.volume + step);
    }

    volumeDown(step = 1) {
        this.setVolume(this.volume - step);
    }

    setChannel(channel: number) {
        if (!this.isPowerOn) {
            console.log("TV đang tắt");
            return;
        }

        if (channel <= 0) return;

        this.channel = channel;

        console.log(`Kênh hiện tại: ${this.channel}`);
    }

    nextChannel() {
        this.setChannel(this.channel + 1);
    }

    previousChannel() {
        if (this.channel > 1) {
            this.setChannel(this.channel - 1);
        }
    }

    getStatus() {
        return {
            power: this.isPowerOn,
            volume: this.volume,
            channel: this.channel,
        };
    }
}