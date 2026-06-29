import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super({ success: false, message, statusCode: status }, status);
  }
}

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string) {
    const status = HttpStatus.NOT_FOUND;
    super(
      { success: false, message: `${resource} not found`, statusCode: status },
      status,
    );
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = 'Unauthorized') {
    const status = HttpStatus.UNAUTHORIZED;
    super({ success: false, message, statusCode: status }, status);
  }
}
