import { invoke } from "@tauri-apps/api/core"; // Dùng '@tauri-apps/api/tauri' nếu là Tauri v1

// Cấu hình URL gốc của Server API bên thứ 3 của bạn
const BASE_URL = "http://192.168.1.7:8081";

class HttpClient {
    private accessToken: string | null = null;

    constructor() {
        // Thử load lại token cũ từ localStorage nếu có khi khởi tạo app
        if (typeof window !== "undefined") {
            this.accessToken = localStorage.getItem("access_token");
        }
    }

    // Hàm cập nhật token sau khi đăng nhập thành công
    async setAccessToken(token: string) {
        this.accessToken = token;
        localStorage.setItem("access_token", token);
    }

    // Hàm xóa token khi logout
    async clearToken() {
        this.accessToken = null;
        localStorage.removeItem("access_token");
    }

    // Hàm bổ trợ xử lý URL tương đối thành tuyệt đối
    private buildUrl(path: string): string {
        return path.startsWith("http") ? path : `${BASE_URL}${path}`;
    }

    // Phương thức POST generic phù hợp với hàm gọi trong form của bạn
    async post<T>(path: string, body?: any): Promise<T> {
        try {
            const fullUrl = this.buildUrl(path);

            // Gọi xuống Command của Rust
            const response = await invoke<T>("api_request", {
                method: "POST",
                url: fullUrl,
                sessionToken: this.accessToken, // Sẽ truyền qua Rust dưới dạng Option<String>
                body: body ?? null,
            });

            return response;
        } catch (error: any) {
            // Ép kiểu hoặc xử lý lỗi từ Rust trả về dạng chuỗi text
            throw new Error(error || "An error occurred during POST request");
        }
    }

    // Bạn có thể viết thêm các hàm get, put, delete tương tự tại đây...
    async get<T>(path: string): Promise<T> {
        return invoke<T>("api_request", {
            method: "GET",
            url: this.buildUrl(path),
            sessionToken: this.accessToken,
            body: null,
        });
    }
}

export const apiClient = new HttpClient();
