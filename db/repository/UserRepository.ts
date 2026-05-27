// src/repositories/UserRepository.ts

import { SQLiteBase } from "@/db/SQLiteBase";
import { User, UserRole } from "../types/user";

class UserRepository extends SQLiteBase<User> {

    constructor() {
        super("users");
    }

    // ================= CREATE OWNER =================

    async createOwner(data: Partial<User>) {
        return await this.create({
            ...data,
            parent_id: null,
            is_owner: true,
            role: "owner",
        });
    }

    // ================= CREATE CHILD USER =================

    async createChildUser(
        parentId: string,
        data: Partial<User>
    ) {
        return await this.create({
            ...data,
            parent_id: parentId,
            is_owner: false,
        });
    }

    // ================= FIND BY EMAIL =================

    async findByEmail(email: string) {
        const rows = await this.query<User>(
            `
            SELECT *
            FROM users
            WHERE email = ?
            LIMIT 1
            `,
            [email]
        );

        return rows[0] ?? null;
    }

    // ================= FIND CHILDREN =================

    async findChildren(parentId: string) {
        return await this.query<User>(
            `
            SELECT *
            FROM users
            WHERE parent_id = ?
            ORDER BY created_at DESC
            `,
            [parentId]
        );
    }

    // ================= FIND PARENT =================

    async findParent(userId: string) {
        const rows = await this.query<User>(
            `
            SELECT p.*
            FROM users u
            JOIN users p
                ON u.parent_id = p.id
            WHERE u.id = ?
            LIMIT 1
            `,
            [userId]
        );

        return rows[0] ?? null;
    }

    // ================= FIND OWNER =================

    async findOwner() {
        const rows = await this.query<User>(
            `
            SELECT *
            FROM users
            WHERE is_owner = 1
            LIMIT 1
            `
        );

        return rows[0] ?? null;
    }

    // ================= FIND BY ROLE =================

    async findByRole(role: UserRole) {
        return await this.query<User>(
            `
            SELECT *
            FROM users
            WHERE role = ?
            ORDER BY created_at DESC
            `,
            [role]
        );
    }

    // ================= EXISTS EMAIL =================

    async existsEmail(email: string) {
        const rows = await this.query<{ total: number }>(
            `
            SELECT COUNT(*) as total
            FROM users
            WHERE email = ?
            `,
            [email]
        );

        return (rows[0]?.total ?? 0) > 0;
    }

    // ================= SEARCH =================

    async search(keyword: string) {
        return await this.query<User>(
            `
            SELECT *
            FROM users
            WHERE
                name LIKE ?
                OR email LIKE ?
            ORDER BY created_at DESC
            `,
            [
                `%${keyword}%`,
                `%${keyword}%`,
            ]
        );
    }

    // ================= DELETE CHILDREN =================

    async deleteChildren(parentId: string) {
        return await this.execute(
            `
            DELETE FROM users
            WHERE parent_id = ?
            `,
            [parentId]
        );
    }

    // ================= COUNT CHILDREN =================

    async countChildren(parentId: string) {
        const rows = await this.query<{ total: number }>(
            `
            SELECT COUNT(*) as total
            FROM users
            WHERE parent_id = ?
            `,
            [parentId]
        );

        return rows[0]?.total ?? 0;
    }
}

export const userRepo = new UserRepository();