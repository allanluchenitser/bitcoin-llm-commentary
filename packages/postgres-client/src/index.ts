import { Pool, PoolConfig, QueryResult } from 'pg';
import type {
  OHLCVRow,
  OHLCV,
  LLMCommentary
} from "@blc/contracts";

type LLMCommentaryParams = Partial<LLMCommentary>;

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
      INSERT INTO ohlcv_1m (
        exchange,
        symbol,
        ts,
        open,
        high,
        low,
        close,
        volume
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (exchange, symbol, ts) DO NOTHING
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
    ];

    try {
      await this.query(queryText, queryValues);
    } catch (err) {
      console.error('Error inserting OHLCV data:', err);
    }
  }

  async getInstrumentHistory(
    exchange: string = "kraken",
    symbol: string = "BTC/USD",
    limit: number = 30,
    startTs?: string,
    endTs?: string
  ): Promise<OHLCVRow[]> {
    let queryText = `SELECT * FROM ohlcv_1m WHERE exchange = $1 AND symbol = $2`;
    const params: any[] = [exchange, symbol];
    if (startTs) {
      queryText += ` AND ts >= $3`;
      params.push(startTs);
    }
    if (endTs) {
      queryText += startTs ? ` AND ts < $4` : ` AND ts < $3`;
      params.push(endTs);
    }
    queryText += ` ORDER BY ts DESC LIMIT ${limit}`; // 3 days of 1m data
    const result = await this.query(queryText, params);
    return result.rows;
  }

  async insertLLMCommentary({
    exchange = "kraken",
    symbol = "BTC/USD",
    ts = new Date().toISOString(),
    commentary,
    summaryType = "commentary",
    llmUsed = "gpt-4"
  }: LLMCommentaryParams): Promise<void> {
    const queryText = `
      INSERT INTO llm_price_summaries (
        exchange,
        symbol,
        timestamp,
        summary,
        summary_type,
        llm_used
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const queryValues = [exchange, symbol, ts, commentary, summaryType, llmUsed];

    try {
      await this.query(queryText, queryValues);
    } catch (err) {
      console.error('Error inserting LLM price summary:', err);
    }
  }

  async getLLMCommentary(
    exchange: string = "kraken",
    symbol: string = "BTC/USD",
    limit: number = 10
  ): Promise<LLMCommentary[]> {
    const queryText = `
      SELECT exchange, symbol, timestamp AS ts, summary AS commentary, summary_type AS "summaryType", llm_used AS "llmUsed"
      FROM llm_price_summaries
      WHERE exchange = $1 AND symbol = $2
      ORDER BY timestamp DESC
      LIMIT $3
    `;
    const queryValues = [exchange, symbol, limit];

    try {
      const result = await this.query(queryText, queryValues);
      return result.rows as LLMCommentary[];
    } catch (err) {
      console.error('Error reading LLM price summaries:', err);
      return [];
    }
  }
}

export default PostgresClient;
