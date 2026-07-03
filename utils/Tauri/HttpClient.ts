import { invoke } from "@tauri-apps/api/core";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

if (!BASE_URL) {
    throw new Error("Missing environment variable: NEXT_PUBLIC_API_BASE_URL");
}

class HttpClient {
    private accessToken: string | null = null;

    constructor() {
        if (typeof window !== "undefined") {
            this.accessToken = localStorage.getItem("access_token");
        }
    }

    async setAccessToken(token: string): Promise<void> {
        this.accessToken = token;
        localStorage.setItem("access_token", token);
    }

    async clearToken(): Promise<void> {
        this.accessToken = null;
        localStorage.removeItem("access_token");
    }

    private buildUrl(path: string): string {
        return /^https?:\/\//.test(path) ? path : `${BASE_URL}${path}`;
    }

    async post<T>(path: string, body?: unknown, options?: { auth?: boolean }): Promise<T> {
        try {
            return await invoke<T>("api_request", {
                method: "POST",
                url: this.buildUrl(path),
                sessionToken: options?.auth === false ? null : this.accessToken,
                body: body ?? null,
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(message || "An error occurred during POST request");
        }
    }

    async put<T>(path: string, body?: unknown, options?: { auth?: boolean }): Promise<T> {
        try {
            return await invoke<T>("api_request", {
                method: "PUT",
                url: this.buildUrl(path),
                sessionToken: options?.auth === false ? null : this.accessToken,
                body: body ?? null,
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(message || "An error occurred during PUT request");
        }
    }

    async get<T>(path: string): Promise<T> {
        return invoke<T>("api_request", {
            method: "GET",
            url: this.buildUrl(path),
            sessionToken: this.accessToken,
            body: null,
        });
    }

    async delete<T = void>(path: string): Promise<T> {
        return invoke<T>("api_request", {
            method: "DELETE",
            url: this.buildUrl(path),
            sessionToken: this.accessToken,
            body: null,
        });
    }
}

export const apiClient = new HttpClient();
