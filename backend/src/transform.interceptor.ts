import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Response } from './utils/response';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => {
        if (data instanceof Response) {
          return data;
        }
        return Response.success('Success', data, context.switchToHttp().getResponse().statusCode);
      }),
      catchError(error => {
        if (error instanceof HttpException) {
          return throwError(error);
        }
        return throwError(new HttpException(error.message, 500));
      }),
    );
  }
}
