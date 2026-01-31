import express from "express";
import type { SseHub } from "../sse/hub.js";
import { createSseRouter } from "../sse/routes.js";

export function createApp(deps: { sseHub: SseHub }) {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

  // SSE endpoints
  app.use("/sse", createSseRouter(deps.sseHub));

  // TODO: REST endpoints for Postgres lookups under /api/*

  // 404
  app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

  // error handler
  app.use((err: unknown, _req: any, res: any, _next: any) => {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  return app;
}