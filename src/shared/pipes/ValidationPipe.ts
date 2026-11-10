import {
  BadRequestException,
  Injectable,
  ValidationPipe as ValidPipe,
  type ValidationPipeOptions,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';

@Injectable()
export class ValidationPipe extends ValidPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      ...options,
      exceptionFactory: (errors: ValidationError[]) => {
        const formattedErrors = formatErrors(errors);
        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: formattedErrors,
        });
      },
    });
  }
}

function formatErrors(
  errors: ValidationError[],
  parentPath = '',
): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const error of errors) {
    const path = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      result[path] = Object.values(error.constraints);
    }

    if (error.children && error.children.length > 0) {
      const childErrors = formatErrors(error.children, path);
      Object.assign(result, childErrors);
    }
  }

  console.log('Validation pipe result: ', JSON.stringify(result));

  return result;
}
