import HttpError from '../../src/utils/HttpError';

describe('HttpError', () => {
  it('should create an instance of HttpError with correct properties', () => {
    const errorMessage = 'Something went wrong';
    const statusCode = 400;
    const details = { field1: ['Invalid value'] };
    const meta = { traceId: 'abc123' };

    const error = new HttpError(errorMessage, statusCode, details, meta);

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(errorMessage);
    expect(error.statusCode).toBe(statusCode);
    expect(error.details).toEqual(details);
    expect(error.meta).toEqual(meta);
  });

  it('should default to status code 500 if not provided', () => {
    const errorMessage = 'Internal Server Error';
    const error = new HttpError(errorMessage);

    expect(error.statusCode).toBe(500);
  });

  it('should allow for an empty details and meta', () => {
    const errorMessage = 'Unknown Error';
    const error = new HttpError(errorMessage, 500);

    expect(error.details).toBeUndefined();
    expect(error.meta).toBeUndefined();
  });
});