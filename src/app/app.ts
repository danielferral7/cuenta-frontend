import { Component, HostListener, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EstadosComponent } from "./components/estado.component/estado.component";
import { ListBalancesModule } from './modules/list-balances/list-balances-module';
import { PdfComponent } from "./components/pdf.component/pdf.component";
import { SincronizarComponent } from "./components/sincronizar.component/sincronizar.component";
import { NgIf } from '@angular/common';
import { LoaderComponent } from './components/loader.component/loader.component';
import { AccountInfo } from '@azure/msal-browser';
import { MsalService } from '@azure/msal-angular';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [ RouterOutlet, EstadosComponent, ListBalancesModule, PdfComponent, SincronizarComponent, LoaderComponent, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  template: `<msal-redirect></msal-redirect>`,
})
export class App implements OnInit {
  account: AccountInfo | null = null;

  /**
   *
   */
  constructor(private msalService: MsalService, private authService: AuthService) {
  
  }
  
  userPhotoUrl: string | null = null;

  cargarFoto() {
    this.authService.getUserPhoto().subscribe({
      next: (blob) => {
        this.userPhotoUrl = URL.createObjectURL(blob);
      },
      error: () => {
        this.userPhotoUrl = null; // fallback
      }
    });
  }

  ngOnInit(): void {
     this.account = this.msalService.instance.getActiveAccount();

      if (!this.account) {
        const accounts = this.msalService.instance.getAllAccounts();
        if (accounts.length > 0) {
          this.account = accounts[0];
          this.msalService.instance.setActiveAccount(this.account);
        }
      }

      this.userName = this.account?.name || '';
      this.userEmail = this.account?.username || '';

      this.cargarFoto();
  }

  protected readonly title = signal('CuentaFrontend');

  panelActivo: string = 'inicio';
  menuAbierto = false;

  userName = '';
  userEmail = '';

  mostrar(panel: string) {
    this.panelActivo = panel;
    this.obtenerUsuario();
  }

  obtenerUsuario() {
    const token = localStorage.getItem('access_token');

    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));

    this.userName = payload.name;
    this.userEmail = payload.preferred_username;
  }

  actualizarPropiedad(valor: string) {
    this.panelActivo = valor;
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  logout(event: Event) {
    event.stopPropagation();

    this.msalService.logoutRedirect({
      postLogoutRedirectUri: window.location.origin
    });
  }

  @HostListener('document:click')
  clickFuera() {
    this.menuAbierto = false;
  }
}
