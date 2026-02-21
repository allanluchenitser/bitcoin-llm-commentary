import { Pool, PoolConfig, QueryResult } from 'pg';
import { type OHLCVRow, type OHLCV } from "@blc/contracts";

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
        exchange,
        symbol,
        ts,
        open,
        high,
        low,
        close,
        volume,
        interval_s
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (exchange, symbol, ts, interval_s) DO NOTHING
    `;
    const queryValues = [
      ohlcv.exchange,
      ohlcv.symbol,
      ohlcv.ts,
      ohlcv.open,
      ohlcv.high,
      ohlcv.low,
      ohlcv.close,
      ohlcv.volume,
      ohlcv.interval_s
    ];

    try {
      await this.query(queryText, queryValues);
    } catch (err) {
      console.error('Error inserting OHLCV data:', err);
    }
  }

  async getInstrumentHistory(
    exchange: string = "kraken",
    symbol: string = "BTC/USD"):
    Promise<OHLCVRow[]>
  {
    const result = await this.query(
      `SELECT * FROM ohlcv WHERE exchange = $1 AND symbol = $2 ORDER BY ts DESC LIMIT 100`,
      [exchange, symbol]
    );
    return result.rows;
  }
}

export default PostgresClient;
