import { Injectable, Injector } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../services/loader.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {

  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {

    console.log("Interceptor ejecutado");

    if (req.url.includes('login.microsoftonline.com')) {
      return next.handle(req);
    }

    const loader = this.injector.get(LoaderService);

    loader.show();

    return next.handle(req).pipe(
      finalize(() => {
        loader.hide();
      })
    );
  }
}