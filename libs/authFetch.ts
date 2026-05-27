// lib/authFetch.ts

import { getToken } from "next-auth/jwt";

export async function authFetch(
    url: string,
    options: RequestInit = {}
) {
    const token = await getToken({
        req: options.headers instanceof Headers
            ? undefined
            : (options as any).req,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const accessToken = token?.accessToken as string | undefined;

    return fetch(url, {
        ...options,
        headers: {
            ...(accessToken && {
                Authorization: `Bearer ${accessToken}`,
            }),
            ...(options.headers || {}),
        },
        cache: "no-store",
    });
}
