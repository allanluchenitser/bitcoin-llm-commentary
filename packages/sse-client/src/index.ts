import {
  Router,
  type Request,
  type Response
} from "express";

import { randomUUID } from "node:crypto";

import { CHANNEL_TICKER_OHLCV } from "@blc/contracts";
import type { RedisClient } from "@blc/redis-client";

/*
  SSE Protocol Reference:

  \n\n means end of message in SSE
  comment lines start with ":"

  id:	Event ID for reconnection
  data:	Payload (required for useful events)
  retry:	Client retry delay (ms)
  event:	Event name (optional)
*/

type Client = {
  id: string;
  res: Response;
};

/* ------ Manage SSE connections ------ */

export class SseClients {
  private clients = new Map<string, Client>();

  addClient(id: string, res: Response) {
    this.clients.set(id, { id, res });
  }

  removeClient(id: string) {
    this.clients.delete(id);
  }

  messageAll(event: string, data: unknown) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const c of this.clients.values()) {
      c.res.write(payload);
    }
  }

  heartbeat(comment = "keepalive") {
    const payload = `: ${comment}\n\n`;
    for (const c of this.clients.values()) {
      c.res.write(payload);
    }
    console.log(`heartbeat to ${this.clients.size} clients`);
  }
}


/* ---- SSE Router and connection setup / teardown ---- */


// creates express endpoint. adds, removes clients.
export function createSseRouter(path: string, hub: SseClients): Router {
  const router = Router();

  router.get(path, (req: Request, res: Response) => {
    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    // If behind a proxy, this can help:
    // res.setHeader("X-Accel-Buffering", "no");

    const id = randomUUID();
    hub.addClient(id, res);
    console.log(`SSE client connected: ${id}`);

    res.write(
      `event: ready\ndata: ${JSON.stringify({ id, message: "connected to ticker SSE stream" })}\n\n`
    );

    req.on("close", () => {
      hub.removeClient(id);
      console.log(`SSE client disconnected: ${id}`);
    });
  });

  return router;
}

export async function priceSubscription_fanOut(
  redis: RedisClient,
  sseClients: SseClients
): Promise<{ stopPrices: () => Promise<void> }> {

  // one redis connection can pub-sub or key-store, not both
  const sub = redis.duplicate();
  await sub.connect();

  await sub.subscribe(CHANNEL_TICKER_OHLCV, (message: string) => {
    try {
    const json = JSON.parse(message);
      if (json.type === "heartbeat") {
        sseClients.heartbeat();
        return;
      }
      if (json.exchange && json.symbol && json.ts) {
        // looks like an OHLCV tick, fan it out to SSE clients
        sseClients.messageAll(CHANNEL_TICKER_OHLCV, json);
      }
    }
    catch (error) {
      console.error("SSE failed to parse message:", message, error);
    }
  });

  return {
    stopPrices: async (): Promise<void> => {
      try {
        await sub.quit();
      }
      catch { }
    }
  };
}