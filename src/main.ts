import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { LoadingInterceptor } from './app/interceptors/loading-interceptor';

// MSAL
import { MsalService, MsalGuard, MsalInterceptor } from '@azure/msal-angular';
import { msalInstance, msalGuardConfig, msalInterceptorConfig } from './app/auth-config';

bootstrapApplication(App, {
  providers: [
    // HTTP + interceptores
    provideHttpClient(withInterceptorsFromDi()),

    // 🔐 MSAL config
    { provide: 'MSAL_INSTANCE', useValue: msalInstance },
    { provide: 'MSAL_GUARD_CONFIG', useValue: msalGuardConfig },
    { provide: 'MSAL_INTERCEPTOR_CONFIG', useValue: msalInterceptorConfig },

    // Servicios MSAL
    MsalService,
    MsalGuard,

    // 🔑 Interceptor de MSAL (TOKEN)
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },

    // ⏳ Tu interceptor (loading)
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true
    }
  ]
});