// Receives raw data from controller
// Converts to DTO instance using plainToClass()
// Removes non-DTO properties (excludeExtraneousValues: true)
// Returns sanitized data

import {
  UseInterceptors,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToClass, ClassConstructor } from 'class-transformer';

// Strongly-typed interface for DTO classes
export interface DtoConstructor<T> {
  new (...args: any[]): T;
}

// Decorator function
export function Serialize<T>(dto: DtoConstructor<T>) {
  return UseInterceptors(new SerializeInterceptor(dto));
}

// Interceptor implementation
export class SerializeInterceptor<T> implements NestInterceptor {
  constructor(private dto: DtoConstructor<T>) {}

  intercept(context: ExecutionContext, handler: CallHandler): Observable<any> {
    return handler.handle().pipe(map((data: any) => this.transform(data)));
  }

  private transform(data: any): any {
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.transformItem(item));
    }

    // Handle paginated responses
    if (data?.data && Array.isArray(data.data)) {
      return {
        ...data,
        data: data.data.map((item: any) => this.transformItem(item)),
      };
    }

    // Handle single objects
    return this.transformItem(data);
  }

  private transformItem(item: any): T {
    return plainToClass(this.dto, item, {
      excludeExtraneousValues: true, // Remove non-DTO properties
      enableImplicitConversion: true, // Auto-convert string to numbers/dates
      strategy: 'excludeAll', // Default: only expose properties with @Expose()
    });
  }
}
