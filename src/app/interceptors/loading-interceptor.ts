import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { LoaderService } from '../services/loader.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {

  constructor(private loader: LoaderService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {

    console.log("Interceptor ejecutado");
    
    this.loader.show();

    return next.handle(req).pipe(
      finalize(() => {
        this.loader.hide();
      })
    );

  }

}