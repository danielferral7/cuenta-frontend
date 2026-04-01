import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private msal: MsalService) {}

  login() {
    this.msal.loginRedirect();
  }

  logout() {
    this.msal.logoutRedirect();
  }

  getUser() {
    return this.msal.instance.getAllAccounts()[0];
  }
}