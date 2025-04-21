export class Response<T> {
  statusCode: number;
  message: string;
  data?: T | null;

  constructor(statusCode: number, message: string, data?: T | null) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  static success<T>(
    message: string,
    data: T,
    statusCode: number = 200,
  ): Response<T> {
    return new Response(statusCode, message, data);
  }

  static error<T>(
    message: string,
    data: T,
    statusCode: number = 400,
  ): Response<T> {
    return new Response(statusCode, message, data);
  }
}
