/* ------ websocket client (node: ws) ------ */
import WebSocket from 'ws';
import { type LoopSocket } from './wsTypes.js';


// https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code
const WS_CLOSE_CODE = {
  NORMAL: 1000,
  GOING_AWAY: 1001,
  INTERNAL_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,

  // reserved (don't send)
  NO_STATUS_RECEIVED: 1005,
  ABNORMAL_CLOSURE: 1006,

  // needs manual change
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
} as const;

const fatalWsErrors = new Set<string>([
  "ERR_INVALID_URL",
  "ERR_TLS_CERT_ALTNAME_INVALID",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "CERT_HAS_EXPIRED"
]);

const fatalCloseCodes = new Set<number>([
  WS_CLOSE_CODE.PROTOCOL_ERROR,
  WS_CLOSE_CODE.UNSUPPORTED_DATA,
  WS_CLOSE_CODE.POLICY_VIOLATION,
  WS_CLOSE_CODE.MESSAGE_TOO_BIG,
]);

type ClientOptions = {
  url: string;
  fatal?: (code: number, reason: string) => void;
  messageFunction?: (data: WebSocket.RawData, isBinary: boolean, socket: LoopSocket) => void;
  openFunction?: (socket: LoopSocket) => void;
  intervalFunction?: (socket: LoopSocket) => void;
};

let reconnectAttempt = 0;
let isInitialConnect = true;
let dontReconnect = false;

let currentSocket: WebSocket | null = null;

export async function connectWs(options: ClientOptions) {
  console.log('attempting ws connection to', options.url);
  async function createSocket() {
    const socket = new WebSocket(options.url);
    currentSocket = socket;
    try {
      if (isInitialConnect) {
        await new Promise<void>((resolve, reject) => {
          init(socket, resolve, reject, options);
        });
      }
      else {
        init(socket, () => {}, () => {}, options);
      }
      return socket;
    }
    catch {
      console.log("initial ws connect failed");
      currentSocket = null;
      return null;
    }
  }

  await createSocket();

  return {
    getSocket: () => currentSocket,
  }
}

function init(
  socket: LoopSocket,
  resolve: () => void,
  reject: (err?: unknown) => void,
  options: ClientOptions
) {

  function onError(err: Error & { code?: string }) {
    console.log("ws error event", err);

    // immediate error may render "close" uncoercable below
    if (isInitialConnect) {
      return reject(err);
    }

    if (err.code && fatalWsErrors.has(err.code)) {
      dontReconnect = true;
    }

    const closeStates: number[] = [WebSocket.CLOSED, WebSocket.CLOSING]

    setTimeout(() => {
      if (closeStates.includes(socket.readyState)) return;

      console.log("error w/ no followup. forcing close.");
      socket.terminate();
      currentSocket = null;
    }, 250);
  }

  function onOpen() {
    console.log("ws open event");

    if (isInitialConnect) resolve();

    isInitialConnect = false;
    reconnectAttempt = 0;
    dontReconnect = false;

    options.openFunction?.(socket)
    options.intervalFunction?.(socket);
  }

  function onMessage(data: WebSocket.RawData, isBinary: boolean) {
    socket.ticks = socket.ticks ? socket.ticks + 1 : 1;
    options.messageFunction?.(data, isBinary, socket);
  }

  function onClose(code: number, reason: Buffer) {
    console.log("ws close event", code, reason.toString("utf-8"));
    cleanup();

    if (isInitialConnect) {
      currentSocket = null;
      return reject(
        new Error(`WebSocket closed during initial connect (code=${code})`
      ));
    }

    isInitialConnect = false;
    dontReconnect = dontReconnect || fatalCloseCodes.has(code);

    if (dontReconnect) {
      console.error("fatal close", code || "no code");
      currentSocket = null;
      const reasonText = reason?.toString?.("utf8") ?? "";
      options.fatal?.(code, reasonText);
      return;
    }

    setTimeout(() => {
      console.log("ws reconnecting...", reconnectAttempt);
      void connectWs(options);
    }, backOff(reconnectAttempt++));
  }

  socket.on("error", onError);
  socket.on("close", onClose);
  socket.once("open", onOpen);
  socket.on("message", onMessage);

  const cleanup = () => {
    socket.off("error", onError);
    socket.off("close", onClose);
    socket.off("open", onOpen);
    socket.off("message", onMessage);
  };
}

/* ------ event listeners ------ */

function backOff(attempt: number) {
  const jitter = Math.floor(Math.random() * 10);
  const total = 250 * 2 ** attempt + jitter;
  const capped = Math.min(30_000, total);

  return capped;
}






