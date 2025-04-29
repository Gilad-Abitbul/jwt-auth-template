export default class HttpError extends Error {
  public statusCode: number;
  public details?: Record<string, string[]>;
  public meta?: Record<string, any>;

  constructor(message: string, statusCode: number = 500, details?: Record<string, string[]>, meta?: Record<string, any>) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.meta = meta;

    Object.setPrototypeOf(this, HttpError.prototype);
  }
}