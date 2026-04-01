import { Injectable, Injector } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../services/loader.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {

  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    console.log('Interceptor ejecutado:', req.url);
    console.log('REQ:', req.url);
    console.log('HEADERS:', req.headers);

    // 🚫 Evitar interferir con MSAL
    if (req.url.includes('login.microsoftonline.com')) {
      return next.handle(req);
    }

    const loader = this.injector.get(LoaderService);

    loader.show();

    return next.handle(req).pipe(
      finalize(() => loader.hide())
    );
  }
}