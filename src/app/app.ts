import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { EstadosComponent } from "./components/estado.component/estado.component";
import { ListBalancesModule } from './modules/list-balances/list-balances-module';
import { PdfComponent } from "./components/pdf.component/pdf.component";
import { SincronizarComponent } from "./components/sincronizar.component/sincronizar.component";
import { NgIf } from '@angular/common';
import { LoaderComponent } from './components/loader.component/loader.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, EstadosComponent, ListBalancesModule, PdfComponent, SincronizarComponent, LoaderComponent, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('CuentaFrontend');

  panelActivo: string = 'inicio';

  mostrar(panel: string) {
    this.panelActivo = panel;
  }

  actualizarPropiedad(valor: string) {
    this.panelActivo = valor;
  }
}
