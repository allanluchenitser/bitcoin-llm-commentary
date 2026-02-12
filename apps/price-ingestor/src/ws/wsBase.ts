import WebSocket from "ws";

let ws: WebSocket | null = null;
let shouldReconnect = true;
let attempt = 0;
let heartbeatTimer: NodeJS.Timeout | null = null;
let stopping = false;

function backOffMs(attemptNum: number, max = 30_000): number {
  const jitter = Math.floor(Math.random() * 10);
  const total = 250 * 2 ** attemptNum + jitter;
  const capped = Math.min(max, total);

  return capped;
}

function clearHeartbeat() {
  if (heartbeatTimer) clearTimeout(heartbeatTimer);
  heartbeatTimer = null;
}

function armHeartbeat(socket: WebSocket, timeoutMs = 45_000) {
  clearHeartbeat();
  heartbeatTimer = setTimeout(() => {

    socket.terminate();
  }, timeoutMs)
}


/*
fundamental ws events:
- lifecycle 1: handshake errors
- lifecycle 2: handshake rejected (http)
- lifecycle 3: connection established (ws)
- lifecycle 4: connection closed (ws)
*/

function connectWs(url: string, onFatal: () => void): WebSocket {
  ws = new WebSocket(url);
  const socket = ws;

  // lifecycle 1: initial handshake problem, DNS/TCP/SSL.
  // Or, ws protocol errors later
  socket.on("error", (err: Error & { code?: string }) => { // NodeJS Error object base
    console.error(`[ws] error: ${String(err)}`);

    const fatalErrors = [
      "ERR_INVALID_URL",
      "ERR_TLS_CERT_ALTNAME_INVALID",
      "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
      "CERT_HAS_EXPIRED"
    ];

    if (fatalErrors.includes(err.code ?? '')) {
      shouldReconnect = false;
      try { socket.terminate(); } catch {}
    }

    if (socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) return;

    if (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN) {
      try { socket.close(); } catch {}
      const t = setTimeout(() => { try { socket.terminate(); } catch {} }, 1000);
      socket.once("close", () => clearTimeout(t));
    }
  });

  // // lifecycle 2: http to ws upgrade problem. never happens after open event
  // socket.once("unexpected-response", (_req, res) => { // http objects
  //   const status = res.statusCode;
  //   console.error(`[ws] unexpected-response HTTP ${status ?? "?"}`);

  //   // hopeless, don't reconnect
  //   if ([401, 403, 404, 426].includes(status ?? 0)) {
  //     shouldReconnect = false;
  //   }

  //   socket.terminate();
  // });

  // lifecycle 3: handshake, upgrade successful. happens once per connection
  socket.once("open", () => {
    armHeartbeat(socket);
    console.log("[ws] connected");
    attempt = 0;
  });


  // lifecycle 4: connection closed
  socket.once("close", (code, reason) => { // websocket objects
    console.log(`[ws] close code ${code}, reason ${reason.toString()}`);

    clearHeartbeat();
    if (ws === socket) ws = null;

    if (!shouldReconnect) {
      console.log("[ws] not reconnecting, probably a config issue. Exiting program.");
      onFatal();
      return;
    }

    setTimeout(() => {
      connectWs(url, onFatal)
    }, backOffMs(attempt++))
  });

  return ws;
}