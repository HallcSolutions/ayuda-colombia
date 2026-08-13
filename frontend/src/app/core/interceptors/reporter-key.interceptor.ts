import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ReporterAccessService } from '../services/reporter-access.service';

const REPORTER_HEADER = 'x-reporter-key';

/** Adjunta el código de brigadista a las peticiones que aún no lo traen. */
export const reporterKeyInterceptor: HttpInterceptorFn = (request, next) => {
  const code = inject(ReporterAccessService).code();
  if (!code || request.headers.has(REPORTER_HEADER)) return next(request);
  return next(request.clone({ setHeaders: { [REPORTER_HEADER]: code } }));
};
