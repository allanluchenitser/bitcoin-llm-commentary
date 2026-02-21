import {
  Router,
  type Request,
  type Response
} from "express";

import { randomUUID } from "node:crypto";
import type { SseClients } from "./sseClients.js";

/* ---- SSE Router and connection setup / teardown ---- */

// note that a SSE message requires an extra newline at the end

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