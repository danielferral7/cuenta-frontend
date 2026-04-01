import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { LoadingInterceptor } from './app/interceptors/loading-interceptor';

import { MsalService, MsalGuard, MsalInterceptor } from '@azure/msal-angular';
import { msalInstance, msalGuardConfig, msalInterceptorConfig } from './app/auth-config';

import { provideRouter } from '@angular/router';
import { HomeComponent } from './app/components/home.component/home.component';
import { EstadosComponent } from './app/components/estado.component/estado.component';

async function bootstrap() {

  const appRef = await bootstrapApplication(App, {
    providers: [

      // ✅ HTTP CLIENT + INTERCEPTORS
      provideHttpClient(withInterceptorsFromDi()),

      // ✅ MSAL CONFIG
      { provide: 'MSAL_INSTANCE', useValue: msalInstance },
      { provide: 'MSAL_GUARD_CONFIG', useValue: msalGuardConfig },
      { provide: 'MSAL_INTERCEPTOR_CONFIG', useValue: msalInterceptorConfig },

      MsalService,
      MsalGuard,

      // ✅ INTERCEPTORS (orden correcto)
      {
        provide: HTTP_INTERCEPTORS,
        useClass: MsalInterceptor,
        multi: true
      },
      {
        provide: HTTP_INTERCEPTORS,
        useClass: LoadingInterceptor,
        multi: true
      },

      // ✅ ROUTES
      provideRouter([
        {
          path: '',
          loadComponent: () => HomeComponent,
          canActivate: [MsalGuard]
        },
        {
          path: 'estados',
          loadComponent: () => EstadosComponent,
          canActivate: [MsalGuard]
        }
      ])
    ]
  });

  // 🔐 MANEJO CORRECTO DEL REDIRECT DE MSAL
  const msalService = appRef.injector.get(MsalService);

  const result = await msalService.instance.handleRedirectPromise();

  if (result && result.account) {
    msalService.instance.setActiveAccount(result.account);
  } else {
    // fallback: si ya había sesión previa
    const accounts = msalService.instance.getAllAccounts();
    if (accounts.length > 0) {
      msalService.instance.setActiveAccount(accounts[0]);
    }
  }
}

bootstrap();