export type UserRole =
    | "owner"
    | "admin"
    | "user"
    | "viewer";

export interface User {
    id: string;

    parent_id?: string | null;

    name: string;
    email: string;

    password?: string | null;

    role: UserRole;

    is_owner: boolean;

    timezone?: string;

    created_at?: string;
}