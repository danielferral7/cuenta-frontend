import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS
} from '@angular/common/http';

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

async function bootstrap() {

  const appRef = await bootstrapApplication(App, {
    providers: [

      provideHttpClient(withInterceptorsFromDi()),

      // 🔐 MSAL CONFIG
      { provide: MSAL_INSTANCE, useValue: msalInstance },
      { provide: MSAL_GUARD_CONFIG, useValue: msalGuardConfig },
      { provide: MSAL_INTERCEPTOR_CONFIG, useValue: msalInterceptorConfig },

      MsalService,
      MsalGuard,
      MsalBroadcastService,

      // 🔥 MSAL INTERCEPTOR
      {
        provide: HTTP_INTERCEPTORS,
        useFactory: (
          msalService: MsalService,
          msalBroadcastService: MsalBroadcastService,
          location: Location
        ) => new MsalInterceptor(
          msalInterceptorConfig,
          msalService,
          location,
          msalBroadcastService,
          document
        ),
        multi: true,
        deps: [MsalService, MsalBroadcastService, Location]
      },

      // ⏳ Loader
      {
        provide: HTTP_INTERCEPTORS,
        useClass: LoadingInterceptor,
        multi: true
      },

      // 🌐 ROUTES (MsalGuard maneja login)
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

  // 🔐 INIT MSAL (SIN LOGIN MANUAL)
  const msalService = appRef.injector.get(MsalService);

  await msalService.instance.initialize();

  let result = null;

  try {
    result = await msalService.instance.handleRedirectPromise();
  } catch (error) {
    console.warn('MSAL redirect error (ignorado):', error);
  }

  const accounts = msalService.instance.getAllAccounts();

  console.log('Login result:', result);
  console.log('Accounts:', accounts);

  // ✅ login reciente
  if (result?.account) {
    msalService.instance.setActiveAccount(result.account);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // ✅ sesión existente
  else if (accounts.length > 0) {
    msalService.instance.setActiveAccount(accounts[0]);
  }

  // ❌ NO login aquí → lo hace MsalGuard

  console.log('Active account:', msalService.instance.getActiveAccount());
}

bootstrap();