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

      // 🔥 HTTP + INTERCEPTORS
      provideHttpClient(
        withInterceptorsFromDi()
      ),

      // 🔐 MSAL CONFIG
      { provide: MSAL_INSTANCE, useValue: msalInstance },
      { provide: MSAL_GUARD_CONFIG, useValue: msalGuardConfig },
      { provide: MSAL_INTERCEPTOR_CONFIG, useValue: msalInterceptorConfig },

      MsalService,
      MsalGuard,
      MsalBroadcastService,

      // 🔥 INTERCEPTOR MSAL (FIX COMPLETO)
      {
        provide: HTTP_INTERCEPTORS,
        useFactory: (
          msalService: MsalService,
          msalBroadcastService: MsalBroadcastService,
          location: Location
        ) => {
          return new MsalInterceptor(
            msalInterceptorConfig,
            msalService,
            location,
            msalBroadcastService,
            document
          );
        },
        multi: true,
        deps: [MsalService, MsalBroadcastService, Location]
      },

      // ⏳ Loader interceptor
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

  // 🔐 INICIALIZAR MSAL
  const msalService = appRef.injector.get(MsalService);

  await msalService.instance.initialize();

  let result = null;

  try {
    result = await msalService.instance.handleRedirectPromise();
  } catch (error) {
    console.warn('MSAL redirect error:', error);

    // 🔥 LIMPIA ESTADO ROTO
    sessionStorage.clear();
    localStorage.removeItem('msal.interaction.status');
  }

  if (!msalService.instance.getActiveAccount()) {
    console.log('🔐 Forzando login limpio...');
    msalService.loginRedirect();
    return;
  }
  
  console.log('Login result:', result);
  console.log('Active account BEFORE:', msalService.instance.getActiveAccount());

  if (result?.account) {
    msalService.instance.setActiveAccount(result.account);

    // 🔥 limpiar URL después de login
    window.history.replaceState({}, document.title, window.location.pathname);

  } else {
    const accounts = msalService.instance.getAllAccounts();
    if (accounts.length > 0) {
      msalService.instance.setActiveAccount(accounts[0]);
    }
  }

  console.log('Active account AFTER:', msalService.instance.getActiveAccount());
}

bootstrap();