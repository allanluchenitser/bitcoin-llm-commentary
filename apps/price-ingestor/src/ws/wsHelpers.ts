import WebSocket from "ws";

function isFatalWsError(err: unknown): boolean {
  const code = (err as { code?: string } | undefined | null)?.code;

  // “Usually won’t fix itself without a deploy/config change”
  return (
    code === "ERR_INVALID_URL" ||
    code === "ERR_TLS_CERT_ALTNAME_INVALID" ||
    code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
    code === "CERT_HAS_EXPIRED"
  );
}

function rawDataToUtf8(data: WebSocket.RawData): string {
  if (Buffer.isBuffer(data)) return data.toString("utf8");
  if (data instanceof ArrayBuffer) return Buffer.from(data).toString("utf8");
  return Buffer.concat(data).toString("utf8");
}

type AsyncHandler<T> = (arg: T) => void | Promise<void>;

/**
 * Throttle an async handler by running it at most once per interval,
 * always with the latest argument seen during the interval.
 * Intermediate messages are dropped.
 */
function throttleLatest<T>(handler: AsyncHandler<T>, intervalMs: number) {
  let lastArg: T | undefined;
  let scheduled = false;
  let running = false;

  const flush = async () => {
    scheduled = false;
    if (running) return;

    const arg = lastArg;
    lastArg = undefined;
    if (arg === undefined) return;

    running = true;
    try {
      await handler(arg);
    } finally {
      running = false;
      // If more messages arrived while running, schedule another flush.
      if (lastArg !== undefined && !scheduled) {
        scheduled = true;
        setTimeout(flush, intervalMs);
      }
    }
  };

  return (arg: T) => {
    lastArg = arg;
    if (!scheduled && !running) {
      scheduled = true;
      setTimeout(flush, intervalMs);
    }
  };
}

export default {
  isFatalWsError,
  rawDataToUtf8,
  throttleLatest
};
