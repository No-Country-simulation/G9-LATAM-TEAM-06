import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export function apiKeyInterceptor(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const apiKey = environment.apiKey;
  if (!apiKey) {
    return next(request);
  }
  const requestClonado = request.clone({
    setHeaders: { 'X-API-KEY': apiKey },
  });
  return next(requestClonado);
}