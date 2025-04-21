import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method;
    const url = req.url;

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        const statusCode = res.statusCode;
        this.logger.log(
          `${method} ${url} ${statusCode} - ${Date.now() - now}ms`,
        );
      }),
    );
  }
}
