import { PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { MsalInterceptorConfiguration } from '@azure/msal-angular';

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId: '2df1eeb1-6b22-4ac8-af11-54a92fbd3135',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: 'https://gentle-moss-04a726a0f.2.azurestaticapps.net/'
  },
  cache: {
    cacheLocation: 'localStorage'
  }
});

export const msalGuardConfig = {
  interactionType: InteractionType.Redirect,
  authRequest: {
    scopes: ['openid', 'profile', 'User.Read']
  }
};

// 🔥 FIX IMPORTANTE: URL BASE (sin /api/)
export const msalInterceptorConfig: MsalInterceptorConfiguration = {
  interactionType: InteractionType.Redirect,
  protectedResourceMap: new Map([
    [
      'https://cuentaapi20260322155911-gxcxhfatbuffgsdk.centralus-01.azurewebsites.net/api/estados',
      ['api://7115c346-d789-46fa-9bd7-fa8a0510e3e1/user_impersonation']
    ]
  ])
};