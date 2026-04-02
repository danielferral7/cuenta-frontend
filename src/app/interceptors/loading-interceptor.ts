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

    // 🚫 1. Ignorar llamadas a MSAL
    if (req.url.includes('login.microsoftonline.com')) {
      return next.handle(req);
    }

    this.totalRequests++;
    loader.show();

    const account = this.msalService.instance.getActiveAccount();

    // 👉 2. Si NO hay sesión → continuar sin token
    if (!account) {
      return next.handle(req).pipe(
        finalize(() => this.handleFinalize(loader))
      );
    }

    // 👉 3. Obtener token y continuar request
    return from(
      this.msalService.acquireTokenSilent({
        account,
        scopes: ['api://7115c346-d789-46fa-9bd7-fa8a0510e3e1/user_impersonation'],
      })
    ).pipe(

      switchMap(tokenResponse => {

        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${tokenResponse.accessToken}`
          }
        });

        return next.handle(authReq);
      }),

      catchError(err => {
        console.error('Error token MSAL:', err);

        // fallback sin token (opcional)
        return next.handle(req);
      }),

      finalize(() => this.handleFinalize(loader))
    );
  }

  private handleFinalize(loader: LoaderService) {
    this.totalRequests--;

    if (this.totalRequests === 0) {
      loader.hide();
    }
  }
}