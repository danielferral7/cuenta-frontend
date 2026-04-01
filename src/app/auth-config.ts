import { PublicClientApplication, InteractionType } from '@azure/msal-browser';

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId: '2df1eeb1-6b22-4ac8-af11-54a92fbd3135',

    // 🔥 CAMBIO CLAVE
    authority: 'https://login.microsoftonline.com/common',

    redirectUri: window.location.origin
  },
  cache: {
    cacheLocation: 'localStorage'
  }
});

export const msalGuardConfig = {
   interactionType: InteractionType.Redirect,  // Usar Redirect
   authRequest: {
    scopes: ['openid', 'profile', 'User.Read']
  }
};

export const msalInterceptorConfig = {
  interactionType: InteractionType.Redirect,
  protectedResourceMap: new Map([
    [
      'https://cuentaapi20260322155911-gxcxhfatbuffgsdk.centralus-01.azurewebsites.net/api/',
      ['api://7115c346-d789-46fa-9bd7-fa8a0510e3e1/user_impersonation']
    ]
  ])
};