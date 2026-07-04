import { invoke } from "@tauri-apps/api/core";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

if (!BASE_URL) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_API_BASE_URL");
}

class HttpClient {
    private accessToken: string | null = null;
    private refreshPromise: Promise<string | null> | null = null;

    constructor() {
        if (typeof window !== "undefined") {
            this.accessToken = localStorage.getItem("access_token");
        }
    }

    async setAccessToken(token: string): Promise<void> {
        this.accessToken = token;
        localStorage.setItem("access_token", token);
    }

    async setRefreshToken(token: string): Promise<void> {
        localStorage.setItem("refresh_token", token);
    }

    async setAuthSession(data: AuthResponseLike): Promise<void> {
        const accessExpiresAt = new Date(Date.now() + data.expiresInSeconds * 1000).toISOString();
        const refreshExpiresAt = new Date(Date.now() + data.refreshExpiresInSeconds * 1000).toISOString();

        this.accessToken = data.accessToken;
        localStorage.setItem("access_token", data.accessToken);
        localStorage.setItem("refresh_token", data.refreshToken);
        localStorage.setItem("access_token_expires_at", accessExpiresAt);
        localStorage.setItem("refresh_token_expires_at", refreshExpiresAt);

        await this.persistTokensToSqlite(data.accessToken, data.refreshToken, refreshExpiresAt);
    }

    async clearToken(): Promise<void> {
        this.accessToken = null;
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("access_token_expires_at");
        localStorage.removeItem("refresh_token_expires_at");
    }

    private buildUrl(path: string): string {
        return /^https?:\/\//.test(path) ? path : `${BASE_URL}${path}`;
    }

    private getAccessTokenExpMs(token: string | null): number | null {
        if (!token) return null;

        try {
            const payload = token.split(".")[1];
            if (!payload) return null;

            const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
            const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
            const decoded = JSON.parse(atob(padded)) as { exp?: number };
            return decoded.exp ? decoded.exp * 1000 : null;
        } catch {
            return null;
        }
    }

    private isTokenExpiringSoon(token: string | null): boolean {
        const expMs = this.getAccessTokenExpMs(token);
        if (!expMs) return Boolean(token);

        return expMs - Date.now() < 60_000;
    }

    private isAuthError(error: unknown): boolean {
        const message = error instanceof Error ? error.message : String(error);
        return message.includes("401") || message.toLowerCase().includes("unauthorized");
    }

    private async persistTokensToSqlite(accessToken: string, refreshToken: string, refreshExpiresAt: string) {
        if (typeof window === "undefined") return;

        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}") as { id?: string; accountId?: string };
            const userId = user.id || user.accountId;
            if (!userId) return;

            const { userSessionRepo } = await import("@/db/repository/UserSessionRepository");
            await userSessionRepo.updateLatestTokensByUserId(userId, accessToken, refreshToken, refreshExpiresAt);
        } catch (error) {
            console.warn("Không thể cập nhật token vào SQLite session:", error);
        }
    }

    private async refreshAccessToken(): Promise<string | null> {
        if (this.refreshPromise) return this.refreshPromise;

        this.refreshPromise = (async () => {
            const refreshToken = localStorage.getItem("refresh_token");
            if (!refreshToken) return null;

            try {
                const data = await invoke<AuthResponseLike>("api_request", {
                    method: "POST",
                    url: this.buildUrl("/api/auth/refresh"),
                    sessionToken: null,
                    body: { refreshToken },
                });

                await this.setAuthSession(data);
                return data.accessToken;
            } catch (error) {
                console.warn("Refresh token không còn hợp lệ hoặc server từ chối:", error);
                await this.clearToken();
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("app-logout"));
                }
                return null;
            } finally {
                this.refreshPromise = null;
            }
        })();

        return this.refreshPromise;
    }

    async ensureValidAccessToken(): Promise<boolean> {
        this.accessToken = this.accessToken || localStorage.getItem("access_token");

        if (!this.accessToken) {
            return Boolean(await this.refreshAccessToken());
        }

        if (this.isTokenExpiringSoon(this.accessToken)) {
            return Boolean(await this.refreshAccessToken());
        }

        return true;
    }

    private async request<T>(method: "GET" | "POST" | "PUT" | "DELETE", path: string, body?: unknown, options?: { auth?: boolean; retry?: boolean }): Promise<T> {
        const shouldAuth = options?.auth !== false;
        if (shouldAuth) {
            await this.ensureValidAccessToken();
        }

        try {
            return await invoke<T>("api_request", {
                method,
                url: this.buildUrl(path),
                sessionToken: shouldAuth ? this.accessToken : null,
                body: body ?? null,
            });
        } catch (error: unknown) {
            if (shouldAuth && options?.retry !== false && this.isAuthError(error)) {
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    return this.request<T>(method, path, body, { ...options, retry: false });
                }
            }

            const message = error instanceof Error ? error.message : String(error);
            throw new Error(message || `An error occurred during ${method} request`);
        }
    }

    async post<T>(path: string, body?: unknown, options?: { auth?: boolean }): Promise<T> {
        return this.request<T>("POST", path, body, options);
    }

    async put<T>(path: string, body?: unknown, options?: { auth?: boolean }): Promise<T> {
        return this.request<T>("PUT", path, body, options);
    }

    async get<T>(path: string): Promise<T> {
        return this.request<T>("GET", path);
    }

    async delete<T = void>(path: string): Promise<T> {
        return this.request<T>("DELETE", path);
    }
}

export const apiClient = new HttpClient();

type AuthResponseLike = {
    accessToken: string;
    refreshToken: string;
    tokenType?: string;
    expiresInSeconds: number;
    refreshExpiresInSeconds: number;
    account?: unknown;
};
