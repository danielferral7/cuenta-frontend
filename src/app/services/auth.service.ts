import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private msal: MsalService, private http: HttpClient) {}

  login() {
    this.msal.loginRedirect();
  }

  logout() {
    this.msal.logoutRedirect();
  }

  getUser() {
    return this.msal.instance.getAllAccounts()[0];
  }

  getUserPhoto(): Observable<Blob> {
  return this.http.get(
    'https://graph.microsoft.com/v1.0/me/photo/$value',
    { responseType: 'blob' }
  );
}
}