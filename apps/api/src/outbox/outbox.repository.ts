import { Injectable } from "@nestjs/common";
import { DbService } from "../db/db.service";

@Injectable()
export class OutboxRepository {
  constructor(private readonly db: DbService) {}

  async fetchUnsent(limit: number) {
    const { rows } = await this.db.pool.query(
      `
      SELECT *
      FROM outbox_events
      WHERE sent_at IS NULL
      ORDER BY created_at ASC
      LIMIT $1
      `,
      [limit],
    );
    return rows;
  }

  async markSent(id: string) {
    await this.db.pool.query(
      `UPDATE outbox_events SET sent_at = now() WHERE id = $1`,
      [id],
    );
  }

  async markFailed(id: string, error: string) {
    await this.db.pool.query(
      `UPDATE outbox_events SET attempts = attempts + 1, last_error = $2 WHERE id = $1`,
      [id, error],
    );
  }
}