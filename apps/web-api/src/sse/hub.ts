import type { Response } from "express";

type Client = {
  id: string;
  res: Response;
};

export class SseHub {
  private clients = new Map<string, Client>();

  addClient(id: string, res: Response) {
    this.clients.set(id, { id, res });
  }

  removeClient(id: string) {
    this.clients.delete(id);
  }

  broadcast(event: string, data: unknown) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const c of this.clients.values()) {
      c.res.write(payload);
    }
  }

  heartbeat(comment = "keepalive") {
    // comment lines start with ":" in SSE
    const payload = `: ${comment}\n\n`;
    for (const c of this.clients.values()) {
      c.res.write(payload);
    }
  }
}