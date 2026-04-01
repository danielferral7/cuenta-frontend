import { PublicClientApplication, InteractionType } from '@azure/msal-browser';

export const msalInstance = new PublicClientApplication({
  auth: {
    clientId: '2df1eeb1-6b22-4ac8-af11-54a92fbd3135',
    authority: 'https://login.microsoftonline.com/TU_TENANT_ID',
    redirectUri: 'http://localhost:4200'
  },
  cache: {
    cacheLocation: 'localStorage'
  }
});

export const msalGuardConfig = {
  interactionType: InteractionType.Redirect
};

export const msalInterceptorConfig = {
  interactionType: InteractionType.Redirect,
  protectedResourceMap: new Map([
    ['https://localhost:5001/api', ['api://2df1eeb1-6b22-4ac8-af11-54a92fbd3135/access_as_user']]
  ])
};