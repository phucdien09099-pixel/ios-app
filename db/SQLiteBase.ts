// src/database/SQLiteBase.ts

import { getDB } from ".";


export type PaginationResult<T> = {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export class SQLiteBase<T> {

    constructor(
        protected table: string
    ) { }

    // ================= CREATE =================

    async create(data: Partial<T>) {
        const db = await getDB();
        const keys = Object.keys(data);
        const columns = keys.join(", ");
        const placeholders = keys
            .map(() => "?")
            .join(", ");

        const values = Object.values(data);
        await db.execute(
            `
            INSERT INTO ${this.table}
            (${columns})
            VALUES (${placeholders})
            `,
            values
        );
    }


    // ================= FIND ALL =================

    async findAll(): Promise<T[]> {
        const db = await getDB();
        return await db.select<T[]>(
            `
            SELECT *
            FROM ${this.table}
            ORDER BY id DESC
            `
        );
    }


    // ================= FIND BY ID =================

    async findById(id: any): Promise<T | null> {
        const db = await getDB();
        const rows = await db.select<T[]>(
            `
                SELECT *
                FROM ${this.table}
                WHERE id = ?
                LIMIT 1
                `,
            [id]
        );

        return rows[0] ?? null;
    }


    // ================= UPDATE =================

    async update(id: number, data: Partial<T>) {
        const db = await getDB();
        const keys = Object.keys(data);
        const fields = keys
            .map((key) => `${key} = ?`)
            .join(", ");
        const values = Object.values(data);
        values.push(id);
        await db.execute(
            `
            UPDATE ${this.table}
            SET ${fields}
            WHERE id = ?
            `,
            values
        );
    }


    // ================= DELETE =================

    async delete(id: number) {
        const db = await getDB();
        await db.execute(
            `
            DELETE FROM ${this.table}
            WHERE id = ?
            `,
            [id]
        );
    }


    // ================= PAGINATION =================

    async paginate(
        page: number = 1,
        limit: number = 10,
        options?: {
            where?: string;
            params?: any[];
            orderBy?: string;
        }): Promise<PaginationResult<T>> {
        const db = await getDB();

        const offset = (page - 1) * limit;

        const whereClause = options?.where
            ? `WHERE ${options.where}`
            : "";

        const orderBy = options?.orderBy
            ? `ORDER BY ${options.orderBy}`
            : "ORDER BY id DESC";

        const params = options?.params ?? [];

        // ================= TOTAL =================

        const totalRows = await db.select<{ total: number }[]>(
            `
                SELECT COUNT(*) as total
                FROM ${this.table}
                ${whereClause}
                `,
            params
        );

        const total = totalRows[0]?.total ?? 0;

        // ================= DATA =================

        const rows = await db.select<T[]>(
            `
                SELECT *
                FROM ${this.table}
                ${whereClause}
                ${orderBy}
                LIMIT ?
                OFFSET ?
                `,
            [
                ...params,
                limit,
                offset,
            ]
        );
        return {
            data: rows,
            total,
            page,
            limit,
            totalPages:
                Math.ceil(
                    total / limit
                ),
        };
    }


    // ================= COUNT =================

    async count(): Promise<number> {
        const db = await getDB();
        const rows = await db.select<{ total: number }[]>(
            `
                SELECT COUNT(*) as total
                FROM ${this.table}
                `
        );
        return rows[0]?.total ?? 0;
    }


    // ================= RAW QUERY =================

    async query<R = any>(sql: string, params: any[] = []): Promise<R[]> {
        const db = await getDB();
        return await db.select<R[]>(
            sql,
            params
        );
    }


    // ================= EXECUTE =================

    async execute(sql: string, params: any[] = []) {
        const db = await getDB();
        return await db.execute(
            sql,
            params
        );
    }
}
