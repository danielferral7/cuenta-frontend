import { Component, HostListener, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EstadosComponent } from "./components/estado.component/estado.component";
import { ListBalancesModule } from './modules/list-balances/list-balances-module';
import { PdfComponent } from "./components/pdf.component/pdf.component";
import { SincronizarComponent } from "./components/sincronizar.component/sincronizar.component";
import { NgIf } from '@angular/common';
import { LoaderComponent } from './components/loader.component/loader.component';
import { AccountInfo, InteractionStatus } from '@azure/msal-browser';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';

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
  constructor(private msalBroadcastService: MsalBroadcastService, private msalService: MsalService, private authService: AuthService) {
  
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

  ngOnInit() {

     this.msalBroadcastService.inProgress$
      .pipe(filter(status => status === InteractionStatus.None))
      .subscribe(() => {
        const account = this.msalService.instance.getActiveAccount();

        if (!account) {
          const accounts = this.msalService.instance.getAllAccounts();
          if (accounts.length > 0) {
            this.msalService.instance.setActiveAccount(accounts[0]);
          }
        }

        this.userName = this.msalService.instance.getActiveAccount()?.name || '';
        this.userEmail = this.msalService.instance.getActiveAccount()?.username || '';
      });

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

  toggleMenu(event: Event) {
    event.stopPropagation(); // 🔥 clave
    console.log('click menu');
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
