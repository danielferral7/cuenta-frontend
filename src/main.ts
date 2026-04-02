// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Location } from '@angular/common';

import { LoadingInterceptor } from './app/interceptors/loading-interceptor';

import {
  MsalService,
  MsalGuard,
  MsalInterceptor,
  MsalBroadcastService,
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
import { PdfComponent } from './app/components/pdf.component/pdf.component';

async function bootstrap() {

  const appRef = await bootstrapApplication(App, {
    providers: [

      // 🔑 HttpClient con interceptores DI
      provideHttpClient(withInterceptorsFromDi()),

      // 🔐 MSAL
      { provide: MSAL_INSTANCE, useValue: msalInstance },
      { provide: MSAL_GUARD_CONFIG, useValue: msalGuardConfig },
      { provide: MSAL_INTERCEPTOR_CONFIG, useValue: msalInterceptorConfig },

      MsalService,
      MsalGuard,
      MsalBroadcastService,

      // 🔥 MSAL interceptor (maneja token)
      {
        provide: HTTP_INTERCEPTORS,
        useClass: MsalInterceptor,
        multi: true
      },

      // ⏳ Loading interceptor
      {
        provide: HTTP_INTERCEPTORS,
        useClass: LoadingInterceptor,
        multi: true
      },

      // 🌐 Rutas
      provideRouter([
        {
          path: '',
          loadComponent: () => EstadosComponent,
          canActivate: [MsalGuard]
        }
        // {
        //   path: 'estados',
        //   loadComponent: () => EstadosComponent,
        //   canActivate: [MsalGuard]
        // },
        // {
        //   path: 'pdf/procesar',
        //   loadComponent: () => PdfComponent,
        //   canActivate: [MsalGuard]
        // }
      ])
    ]
  });

  
  // 🔐 Inicialización MSAL
  const msalService = appRef.injector.get(MsalService);

  await msalService.instance.initialize();

  let result = null;

  try {
    result = await msalService.instance.handleRedirectPromise();
  } catch (error) {
    console.warn('MSAL redirect error (ignorado):', error);
  }

  const accounts = msalService.instance.getAllAccounts();

  // ✅ Login reciente
  if (result?.account) {
    msalService.instance.setActiveAccount(result.account);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  // ✅ Sesión existente
  else if (accounts.length > 0) {
    msalService.instance.setActiveAccount(accounts[0]);
  }

  console.log('Active account:', msalService.instance.getActiveAccount());
}

bootstrap();