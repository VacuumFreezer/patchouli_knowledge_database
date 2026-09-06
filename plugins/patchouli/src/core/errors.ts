export type PatchouliErrorCode =
  | "COLLISION"
  | "CONFIGURATION_INVALID"
  | "CONFIGURATION_MISSING"
  | "IO_ERROR"
  | "NOT_FOUND"
  | "PATH_ESCAPE"
  | "TOKEN_CONSUMED"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "VALIDATION_ERROR";

export class PatchouliError extends Error {
  readonly code: PatchouliErrorCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: PatchouliErrorCode,
    message: string,
    details: Record<string, unknown> = {},
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "PatchouliError";
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
