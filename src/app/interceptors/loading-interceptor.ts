import { Injectable, Injector } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent
} from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import { LoaderService } from '../services/loader.service';
import { MsalService } from '@azure/msal-angular';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {

  constructor(private injector: Injector,  private msalService: MsalService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  
    const account = this.msalService.instance.getActiveAccount();
    if (!account) return next.handle(req);

    return from(this.msalService.acquireTokenSilent({
      account,
      scopes: ['api://7115c346-d789-46fa-9bd7-fa8a0510e3e1/user_impersonation'],
    })).pipe(
      switchMap(tokenResponse => {
        console.log('Token adquirido:', tokenResponse.accessToken);
        const authReq = req.clone({
          setHeaders: { Authorization: `Bearer ${tokenResponse.accessToken}` }
        });
        return next.handle(authReq);
      })
    );

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