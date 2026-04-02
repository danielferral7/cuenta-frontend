import { Injectable, Injector } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { finalize, switchMap, catchError } from 'rxjs/operators';
import { LoaderService } from '../services/loader.service';
import { MsalService } from '@azure/msal-angular';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {

  private totalRequests = 0;

  constructor(
    private injector: Injector,
    private msalService: MsalService
  ) {}

 intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const loader = this.injector.get(LoaderService);

    if (req.url.includes('login.microsoftonline.com')) {
      return next.handle(req);
    }

    this.totalRequests++;
     console.log('Requests:', this.totalRequests);
    loader.show();

    const account = this.msalService.instance.getActiveAccount();

    const request$ = account
      ? from(this.msalService.acquireTokenSilent({
          account,
          scopes: ['api://7115c346-d789-46fa-9bd7-fa8a0510e3e1/user_impersonation'],
        })).pipe(
          switchMap(tokenResponse => {
            const authReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${tokenResponse.accessToken}`
              }
            });
            return next.handle(authReq);
          }),
          catchError(err => {
            console.error('MSAL ERROR:', err);
            return next.handle(req);
          })
        )
      : next.handle(req);

    // 🔥 CLAVE: UN SOLO finalize global
    return request$.pipe(
      finalize(() => {
        console.log('FINALIZE EJECUTADO');
        this.totalRequests--;
        console.log('Request finalizado. Pendientes:', this.totalRequests);
        //if (this.totalRequests === 0) {
          loader.hide();
        //}
      })
    );
  }

  private handleFinalize(loader: LoaderService) {
    this.totalRequests--;

    console.log('Request finalizado. Pendientes:', this.totalRequests);
    if (this.totalRequests === 0) {
      loader.hide();
    }
  }
}