import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-home',
  template: ` `
})
export class HomeComponent {

  constructor(private auth: AuthService) {}

  login() {
    this.auth.login();
  }

  logout() {
    this.auth.logout();
  }
}