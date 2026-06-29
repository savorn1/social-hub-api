import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

const SENSITIVE_KEYS = new Set([
  'password',
  'confirmPassword',
  'accessToken',
  'refreshToken',
  'botToken',
  'token',
  'secret',
  'secretToken',
  'verifyToken',
  'authorization',
]);

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, originalUrl, query } = req;
    const user = (req as Request & { user?: { id?: string; email?: string } })
      .user;
    const start = Date.now();

    const bodyStr = this.formatBody(req.body);
    const queryStr = Object.keys(query ?? {}).length
      ? ` query=${JSON.stringify(query)}`
      : '';

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        const ms = Date.now() - start;
        // const userTag = user?.id ? ` user=${user.id}` : '';
        // const ipTag = ip ? ` ip=${ip}` : '';

        this.logger.log(
          `${method} ${originalUrl} → ${res.statusCode} +${ms}ms`,
        );
        if (queryStr) this.logger.debug(`  ↳${queryStr}`);
        if (bodyStr) this.logger.debug(`  ↳ body=${bodyStr}`);
      }),
      catchError((err: unknown) => {
        const ms = Date.now() - start;
        const status =
          (err as { status?: number; statusCode?: number })?.status ??
          (err as { statusCode?: number })?.statusCode ??
          500;
        const message =
          (err as { message?: string })?.message ?? 'Internal server error';
        const userTag = user?.id ? ` user=${user.id}` : '';

        this.logger.error(
          `${method} ${originalUrl} → ${status} +${ms}ms${userTag} — ${message}`,
        );
        return throwError(() => err);
      }),
    );
  }

  private formatBody(body: unknown): string | null {
    if (!body || typeof body !== 'object') return null;
    const entries = Object.entries(body as Record<string, unknown>);
    if (!entries.length) return null;

    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of entries) {
      sanitized[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? '***' : v;
    }

    const raw = JSON.stringify(sanitized);
    return raw.length > 300 ? raw.slice(0, 300) + '…' : raw;
  }
}
