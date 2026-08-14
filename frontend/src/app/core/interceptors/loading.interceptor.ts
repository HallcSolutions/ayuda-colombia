import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

/** Mantiene un único indicador aunque varias peticiones ocurran al mismo tiempo. */
export const loadingInterceptor: HttpInterceptorFn = (request, next) => {
  const loading = inject(LoadingService);
  loading.begin();

  return next(request).pipe(finalize(() => loading.end()));
};
