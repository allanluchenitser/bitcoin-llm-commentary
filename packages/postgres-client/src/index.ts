import { Pool, PoolConfig, QueryResult } from 'pg';
import { type OHLCV } from "@blc/contracts";

export class PostgresClient {
  private pool: Pool;

  constructor(config: PoolConfig) {
    this.pool = new Pool(config);
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    return this.pool.query(text, params);
  }

  async end(): Promise<void> {
    await this.pool.end();
  }

  async insertOHLCV(ohlcv: OHLCV): Promise<void> {
    const queryText = `
      INSERT INTO ohlcv (
        instrument_id,
        interval_seconds,
        timestamp,
        open,
        high,
        low,
        close,
        volume
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (instrument_id, interval_seconds, timestamp) DO NOTHING
    `;
    const queryValues = [
      ohlcv.instrumentId,
      ohlcv.intervalSeconds,
      new Date(ohlcv.time), // Convert UNIX ms to JS Date for TIMESTAMPTZ
      ohlcv.open,
      ohlcv.high,
      ohlcv.low,
      ohlcv.close,
      ohlcv.volume
    ];

    try {
      await this.query(queryText, queryValues);
    } catch (err) {
      console.error('Error inserting OHLCV data:', err);
    }
  }
}

export default PostgresClient;
