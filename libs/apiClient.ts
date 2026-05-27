class ApiClient {
    base = process.env.HOST_IP;

    async request(
        url: string,
        options?: RequestInit,
        token?: string
    ) {
        const res = await fetch(`${this.base}${url}`, {
            cache: "no-store",
            ...options,
            headers: {
                ...(options?.body instanceof FormData
                    ? {}
                    : {
                        "Content-Type": "application/json",
                    }),

                ...(token && {
                    Authorization: `Bearer ${token}`,
                }),

                ...(options?.headers || {}),
            },
        });

        if (!res.ok) {
            throw new Error(`Request failed: ${res.status}`);
        }

        return res.json();
    }

    get(url: string, token?: string) {
        return this.request(
            url,
            {
                method: "GET",
            },
            token
        );
    }

    post(url: string, body: any, token?: string) {
        return this.request(
            url,
            {
                method: "POST",
                body: JSON.stringify(body),
            },
            token
        );
    }

    put(url: string, body: any, token?: string) {
        return this.request(
            url,
            {
                method: "PUT",
                body: JSON.stringify(body),
            },
            token
        );
    }

    delete(url: string, token?: string) {
        return this.request(
            url,
            {
                method: "DELETE",
            },
            token
        );
    }

    postForm(url: string, formData: FormData, token?: string) {
        return this.request(
            url,
            {
                method: "POST",
                body: formData,
            },
            token
        );
    }
}

export const apiClient = new ApiClient();
