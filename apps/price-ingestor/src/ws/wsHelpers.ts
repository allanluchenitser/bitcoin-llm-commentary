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

export default {
  isFatalWsError,
  rawDataToUtf8
};
