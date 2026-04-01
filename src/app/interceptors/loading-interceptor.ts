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


  const token = localStorage.getItem('access_token'); // o desde MSAL
  console.log('Token en interceptor:', token);
  
  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next.handle(cloned);
  }
  return next.handle(req);


    console.log('Interceptor ejecutado:', req.url);
    console.log('REQ:', req.url);
    console.log('HEADERS:', req.headers);
    console.log(req.headers.get('Authorization'));

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