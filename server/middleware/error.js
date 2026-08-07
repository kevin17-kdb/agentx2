/** Normalizes every error into `{ error: { code, message } }` so the client
 * never needs per-route error parsing. */
export default function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || (status >= 500 ? "INTERNAL" : "ERROR");
  const message = err.expose || status >= 500 ? err.message : err.message;
  if (status >= 500) console.error("[error]", err);
  res.status(status).json({ error: { code, message: message || "Something went wrong." } });
}

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
    this.expose = true;
  }
}
