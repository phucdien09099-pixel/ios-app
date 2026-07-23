type StorageValue<T> = {
    value: T;
    expiresAt?: number;
};

export class LocalStorage {
    static set<T>(
        key: string,
        value: T,
        ttl?: number
    ) {
        if (typeof window === "undefined") return;

        const data: StorageValue<T> = {
            value,
            expiresAt: ttl ? Date.now() + ttl : undefined,
        };

        localStorage.setItem(key, JSON.stringify(data));
    }

    static get<T>(
        key: string,
        defaultValue?: T
    ): T | null {
        if (typeof window === "undefined")
            return defaultValue ?? null;

        const raw = localStorage.getItem(key);

        if (!raw) return defaultValue ?? null;

        try {
            const data = JSON.parse(raw) as StorageValue<T>;

            if (
                data.expiresAt &&
                Date.now() > data.expiresAt
            ) {
                localStorage.removeItem(key);
                return defaultValue ?? null;
            }

            return data.value;
        } catch {
            return defaultValue ?? null;
        }
    }

    static remove(key: string) {
        if (typeof window === "undefined") return;
        localStorage.removeItem(key);
    }

    static clear() {
        if (typeof window === "undefined") return;
        localStorage.clear();
    }
}
