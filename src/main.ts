import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

import {
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { LoadingInterceptor } from './app/interceptors/loading-interceptor';

import {
  MsalService,
  MsalGuard,
  MsalInterceptor,
  MsalBroadcastService
} from '@azure/msal-angular';

import {
  MSAL_INSTANCE,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG
} from '@azure/msal-angular';

import {
  msalInstance,
  msalGuardConfig,
  msalInterceptorConfig
} from './app/auth-config';

import { provideRouter } from '@angular/router';
import { HomeComponent } from './app/components/home.component/home.component';
import { EstadosComponent } from './app/components/estado.component/estado.component';

async function bootstrap() {

  const appRef = await bootstrapApplication(App, {
    providers: [

      // 🔥 HTTP + INTERCEPTORS (CLAVE)
      provideHttpClient(withInterceptorsFromDi()),

      // 🔐 MSAL CONFIG
      { provide: MSAL_INSTANCE, useValue: msalInstance },
      { provide: MSAL_GUARD_CONFIG, useValue: msalGuardConfig },
      { provide: MSAL_INTERCEPTOR_CONFIG, useValue: msalInterceptorConfig },

      MsalService,
      MsalGuard,
      MsalBroadcastService, // ✅ IMPORTANTE

      // 🔁 INTERCEPTORS (orden correcto)
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

      // 🌐 ROUTING
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

  // 🔐 INICIALIZAR MSAL CORRECTAMENTE
  const msalService = appRef.injector.get(MsalService);

  await msalService.instance.initialize();

  const result = await msalService.instance.handleRedirectPromise();

  if (result?.account) {
    msalService.instance.setActiveAccount(result.account);
  } else {
    const accounts = msalService.instance.getAllAccounts();
    if (accounts.length > 0) {
      msalService.instance.setActiveAccount(accounts[0]);
    }
  }
}

bootstrap();