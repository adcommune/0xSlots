/** Error thrown by SlotsClient operations, wrapping the original cause with operation context. */
export class SlotsError extends Error {
  declare readonly cause: unknown;

  constructor(
    public readonly operation: string,
    cause: unknown,
  ) {
    const msg = cause instanceof Error ? cause.message : String(cause);
    super(`${operation}: ${msg}`);
    this.name = "SlotsError";
    this.cause = cause;
  }
}
