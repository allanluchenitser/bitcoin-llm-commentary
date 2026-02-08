import WebSocket from "ws";
import { isFatalWsError } from "./wsHelpers.js";

let stopping = false;
let reconnectTimeoutId: NodeJS.Timeout | undefined;
let attempt = 0;

type ConnectOptions = {
  shutdown: (code: number) => void;
};


function calcBackoffJitter(attemptNum: number, baseMs = 250, capMs = 30_000): number {
  const maxDelay = Math.min(capMs, baseMs * 2 ** attemptNum);
  return Math.floor(Math.random() * maxDelay);
}

function scheduleReconnect(url: string, options: ConnectOptions) {
  if (stopping) return;
  if (reconnectTimeoutId) return;

  const delay = calcBackoffJitter(attempt++);
  console.log(`[ws][kraken] reconnecting in ${delay}ms (attempt=${attempt})`);

  reconnectTimeoutId = setTimeout(() => {
    reconnectTimeoutId = undefined;
    connectWs(url, options);
  }, delay);
}


function connectWs(url: string, options: ConnectOptions): WebSocket | undefined {
  if (stopping) return;

  const ws: WebSocket = new WebSocket(url);

  ws.once("open", () => {
    console.log("[ws][kraken] connected");
    attempt = 0;
  });

  // this event is a successful negotuation but a failed upgrade
  ws.once("unexpected-response", (_req, res) => { // http objects
    const status = res?.statusCode;
    console.error(`[ws][kraken] unexpected-response HTTP ${status ?? "?"}`);

    // hopeless, don't reconnect
    if ([401, 403, 404, 426].includes(status ?? 0)) {
      options.shutdown(1);
      return;
    }

    scheduleReconnect(url, options);
  });

  ws.once("close", (code, reason) => { // websocket objects
    // console.log(code, reason);
    const reasonText = reason?.length ? reason.toString("utf8") : "";
    scheduleReconnect(url, options);
  });

  ws.on("error", (err: Error) => { // NodeJS Error objects
      if (isFatalWsError(err)) {
        options.shutdown(1);
      }
      else {
        console.error(`[ws][kraken] ${String(err)}`);
      }
  });

  return ws;
}