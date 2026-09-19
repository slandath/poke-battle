export function httpStatus(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  if ("statusCode" in err && typeof err.statusCode === "number") return err.statusCode;
  if ("status" in err && typeof err.status === "number") return err.status;
  return undefined;
}

export function rethrowHttpOrUnavailable(err: unknown): never {
  if (httpStatus(err)) throw err;
  console.error(err);
  throw createError({ statusCode: 503, message: "Database unavailable" });
}
