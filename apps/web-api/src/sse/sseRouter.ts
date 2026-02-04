import type { Request, Response } from "express";
import { Router } from "express";
import { randomUUID } from "node:crypto";
import type { SseHub } from "./sseHub.js";

export function createSseRouter(path: string, hub: SseHub) {
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

    // initial message (optional)
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