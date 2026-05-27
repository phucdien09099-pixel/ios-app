// src/repositories/UserSessionRepository.ts

import { SQLiteBase } from "@/db/SQLiteBase";
import { UserSession } from "../types/session";

class UserSessionRepository extends SQLiteBase<UserSession> {

    constructor() {
        super("user_sessions");
    }
    // ================= GET LATEST ACTIVE USER =================

    async getLatestActiveUser() {
        const rows = await this.query<any>(
            `
            SELECT
                u.id,
                u.email,
                u.name,
                u.parent_id,
                u.is_owner,
                s.access_token,
                s.refresh_token,
                s.created_at as session_created_at
            FROM user_sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.expires_at IS NULL OR s.expires_at > datetime('now')
            ORDER BY s.created_at DESC
            LIMIT 1
            `
        );

        return rows[0] ?? null;
    }
    // ================= FIND BY REFRESH TOKEN =================

    async findByRefreshToken(refreshToken: string) {
        const rows = await this.query<UserSession>(
            `
            SELECT *
            FROM user_sessions
            WHERE refresh_token = ?
            LIMIT 1
            `,
            [refreshToken]
        );

        return rows[0] ?? null;
    }

    // ================= FIND USER SESSIONS =================

    async findByUserId(userId: string) {
        return await this.query<UserSession>(
            `
            SELECT *
            FROM user_sessions
            WHERE user_id = ?
            ORDER BY created_at DESC
            `,
            [userId]
        );
    }

    // ================= CREATE SESSION =================

    async createSession(data: Partial<UserSession>) {
        return await this.create(data);
    }

    // ================= UPDATE TOKENS =================

    async updateTokens(
        sessionId: string,
        accessToken: string,
        refreshToken: string,
        expiresAt?: string
    ) {
        return await this.update(sessionId as any, {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiresAt,
        });
    }

    // ================= DELETE SESSION =================

    async deleteSession(sessionId: string) {
        return await this.delete(sessionId as any);
    }

    // ================= DELETE USER SESSIONS =================

    async deleteByUserId(userId: string) {
        return await this.execute(
            `
            DELETE FROM user_sessions
            WHERE user_id = ?
            `,
            [userId]
        );
    }

    // ================= DELETE BY REFRESH TOKEN =================

    async deleteByRefreshToken(refreshToken: string) {
        return await this.execute(
            `
            DELETE FROM user_sessions
            WHERE refresh_token = ?
            `,
            [refreshToken]
        );
    }

    // ================= COUNT USER SESSIONS =================

    async countUserSessions(userId: string) {
        const rows = await this.query<{ total: number }>(
            `
            SELECT COUNT(*) as total
            FROM user_sessions
            WHERE user_id = ?
            `,
            [userId]
        );

        return rows[0]?.total ?? 0;
    }

    // ================= DELETE EXPIRED =================

    async deleteExpiredSessions() {
        return await this.execute(
            `
            DELETE FROM user_sessions
            WHERE expires_at IS NOT NULL
            AND expires_at < datetime('now')
            `
        );
    }

    // ================= FIND ACTIVE SESSION =================

    async findActiveSession(
        userId: string,
        deviceName?: string
    ) {
        const rows = await this.query<UserSession>(
            `
            SELECT *
            FROM user_sessions
            WHERE user_id = ?
            ${deviceName ? "AND device_name = ?" : ""}
            ORDER BY created_at DESC
            LIMIT 1
            `,
            deviceName
                ? [userId, deviceName]
                : [userId]
        );

        return rows[0] ?? null;
    }
}

export const userSessionRepo = new UserSessionRepository();
