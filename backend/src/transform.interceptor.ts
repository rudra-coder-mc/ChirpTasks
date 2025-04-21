import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Response as CustomResponse } from './utils/response'; // Renamed to avoid conflict
import type { Response as ExpressResponse } from 'express'; // Import Express Response type

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, CustomResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<CustomResponse<T>> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- Standard NestJS interceptor pattern handles success/error paths correctly.
    return next.handle().pipe(
      // Assuming this is line 22 or the line triggering the error
      map((data) => {
        // If data is already a CustomResponse, return it directly
        if (data instanceof CustomResponse) {
          return data;
        }

        // Get the underlying HTTP response object with type safety
        const httpResponse = context
          .switchToHttp()
          .getResponse<ExpressResponse>();

        // Otherwise, wrap it in a standard success response
        return CustomResponse.success(
          'Success',
          data,
          httpResponse.statusCode, // Safely access statusCode
        );
      }),
      catchError((error) => {
        // If it's already an HttpException, re-throw it for NestJS to handle
        if (error instanceof HttpException) {
          return throwError(() => error); // Use factory function for RxJS v7+ compatibility
        }

        // For unknown errors, log them (optional but recommended)
        // console.error('Unhandled error in interceptor:', error);

        // Check if it's an Error instance to safely access message
        const message =
          error instanceof Error ? error.message : 'Internal server error';

        // Wrap unknown errors in a standard InternalServerErrorException
        return throwError(() => new InternalServerErrorException(message)); // Use factory function
      }),
    );
  }
}
