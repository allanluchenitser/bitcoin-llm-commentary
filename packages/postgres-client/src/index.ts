import { Pool, PoolConfig, QueryResult } from 'pg';
import { type OHLCVRow, type OHLCV } from "@blc/contracts";

type LLMCommentaryParams = {
  exchange?: string;
  symbol?: string;
  ts?: string;
  commentary: string;
  summaryType?: string;
  llmUsed?: string;
}

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
    queryText += ` ORDER BY ts DESC LIMIT 1440`; // 3 days of 1m data
    const result = await this.query(queryText, params);
    return result.rows;
  }

  async getInstrumentBigBucketHistory(
    instrumentId: string,
    startTs: string,
    endTs: string,
    intervalText: string
  ): Promise<OHLCVRow[]> {
    const result = await this.query(
      this.getAggregationQuery(),
      [instrumentId, startTs, endTs, intervalText]
    );
    return result.rows;
  }

  async saveLLMCommentary({
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

  private getAggregationQuery(): string {
    return `
    -- params:
    -- $1 instrument_id
    -- $2 start_ts
    -- $3 end_ts
    -- $4 interval_text ('15 minutes' | '1 hour' | '1 day')

    WITH base AS (
      SELECT
        date_bin($4::interval, ts, '1970-01-01'::timestamptz) AS bucket_ts,
        ts, open, high, low, close, volume
      FROM ohlcv_1m
      WHERE instrument_id = $1
        AND ts >= $2
        AND ts <  $3
    ),
    agg AS (
      SELECT
        bucket_ts AS ts,
        (array_agg(open  ORDER BY ts ASC))[1] AS open,
        max(high) AS high,
        min(low)  AS low,
        (array_agg(close ORDER BY ts ASC))[array_length(array_agg(close ORDER BY ts ASC), 1)] AS close,
        sum(volume) AS volume
      FROM base
      GROUP BY bucket_ts
    )
    SELECT ts, open, high, low, close, volume
    FROM agg
    ORDER BY ts;`
  }
}

export default PostgresClient;
