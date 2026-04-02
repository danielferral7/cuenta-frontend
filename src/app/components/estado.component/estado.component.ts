import { Component, Injector, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { EstadoService } from '../../services/estado.service';
import { AsyncPipe, CommonModule, NgFor } from '@angular/common';
import {
  Observable,
  Subject,
  switchMap,
  startWith,
  map,
  tap,
  takeUntil,
  finalize,
  filter
} from 'rxjs';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoaderService } from '../../services/loader.service';

import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { AuthenticationResult, InteractionStatus } from '@azure/msal-browser';

@Component({
  selector: 'app-estados',
  templateUrl: './estado.component.html',
  styleUrl: './estado.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgFor,
    ReactiveFormsModule,
    AsyncPipe,
    CommonModule,
    MatSnackBarModule
  ]
})
export class EstadosComponent implements OnInit, OnDestroy {

  estados$!: Observable<any[]>;
  tarjetas$!: Observable<any[]>;

  movimientoForm!: FormGroup;

  totalDeuda = 0;
  totalGastos = 0;
  pagoMinimoTotal = 0;
  pagosProximos = 0;
  tarjetasRiesgo = 0;

  private refresh$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(
    private service: EstadoService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private injector: Injector,
    private msal: MsalService,
    private msalBroadcast: MsalBroadcastService
  ) {
    this.movimientoForm = this.fb.group({
      estadoCuentaId: 0,
      monto: [0, Validators.min(0)],
      descripcion: ['', Validators.required]
    });
  }

  async ngOnInit() {

      console.log('init');
    await this.msal.instance.initialize();

    const result = await this.msal.instance.handleRedirectPromise();

    if (result?.account) {
      this.msal.instance.setActiveAccount(result.account);
    } else {
      const accounts = this.msal.instance.getAllAccounts();
      if (accounts.length > 0) {
        this.msal.instance.setActiveAccount(accounts[0]);
      }
    }

    this.listenMsal();
  }

  listenMsal() {
  this.msalBroadcast.inProgress$
    .pipe(
      filter(status => status === InteractionStatus.None),
      takeUntil(this.destroy$)
    )
    .subscribe(() => {

      const account = this.msal.instance.getActiveAccount();

      if (!account) {
        console.warn('❌ No hay cuenta activa');
        return;
      }

      console.log('✅ MSAL listo:', account.username);

      this.msal.acquireTokenSilent({
        scopes: ['api://7115c346-d789-46fa-9bd7-fa8a0510e3e1/user_impersonation'],
        account
      }).subscribe({
        next: (result) => {  console.log('Token:', result.accessToken); },
        error: (err) => console.error('❌ ERROR TOKEN:', err)
      });

    });

  this.initData();
}

  ngOnDestroy() {
    console.log('destroy');
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackById(index: number, item: any) {
    return item.id;
  }

  // =========================
  // 🔄 INIT DATA
  // =========================
  initData() {

    const loader = this.injector.get(LoaderService);

    this.estados$ = this.refresh$.pipe(
      startWith(void 0),
      switchMap(() => {
        loader.show();

        return this.service.getEstados().pipe(
          finalize(() => loader.hide())
        );
      }),
      map(data =>
        data.map(e => {
          const gastosMes =
            e.movimientos?.reduce((sum: number, m: any) => sum + m.monto, 0) || 0;

          return {
            ...e,
            saldoTotal: e.saldoTotal + gastosMes,
            gastosMes
          };
        })
      )
    );

    this.buildTarjetas();
    this.buildMetricas();
  }

  // =========================
  // 📊 TARJETAS
  // =========================
  buildTarjetas() {
    this.tarjetas$ = this.estados$.pipe(
      map(tarjetas =>
        [...tarjetas].sort((a, b) =>
          new Date(a.fechaCorte).getTime() - new Date(b.fechaCorte).getTime()
        )
      )
    );
  }

  // =========================
  // 📈 METRICAS (SIN MEMORY LEAK)
  // =========================
  buildMetricas() {
    this.estados$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {

        this.totalDeuda = 0;
        this.totalGastos = 0;
        this.pagoMinimoTotal = 0;
        this.pagosProximos = 0;
        this.tarjetasRiesgo = 0;

        data.forEach(e => {

          this.totalGastos += e.gastosMes;

          if (!e.pagado) {

            this.totalDeuda += Number(e.pagoNoIntereses);
            this.pagoMinimoTotal += Number(e.pagoMinimo);

            const dias = this.getDiasRestantes(e.fechaLimitePago);

            if (dias <= 7 && dias > 0) this.pagosProximos++;
            if (dias <= 1) this.tarjetasRiesgo++;
          }
        });
      });
  }

  // =========================
  // 🎛 UI
  // =========================
  resumenOpen = false;

  toggleResumen() {
    this.resumenOpen = !this.resumenOpen;
  }

  activeCard: any = null;

  toggle(card: any, event: MouseEvent) {
    event.stopPropagation();

    if (this.activeCard && this.activeCard !== card) {
      this.activeCard.open = false;
    }

    card.open = !card.open;
    this.activeCard = card.open ? card : null;
  }

  toggleDetails(card: any, event: MouseEvent) {
    event.stopPropagation();
    card.details = !card.details;
  }

  closeActive() {
    if (this.activeCard) {
      this.activeCard.open = false;
      this.activeCard = null;
    }
  }

  // =========================
  // 💳 LOGICA TARJETA
  // =========================
  getTotalMovimientos(t: any): number {
    return t.movimientos?.reduce((sum: number, m: any) => sum + m.monto, 0) || 0;
  }

  getDisponible(card: any) {
    return card.limiteCredito - card.saldoTotal;
  }

  getUsoCredito(card: any) {
    const usado = (card.saldoTotal / card.limiteCredito) * 100;
    return `${usado}, 100`;
  }

  getPorcentajeUso(card: any) {
    if (!card.limiteCredito) return 0;
    return Math.round((card.saldoTotal / card.limiteCredito) * 100);
  }

  getColorUso(card: any) {
    const uso = this.getPorcentajeUso(card);

    if (uso < 30) return 'uso-bajo';
    if (uso < 60) return 'uso-medio';
    if (uso < 85) return 'uso-alto';
    return 'uso-riesgo';
  }

  // =========================
  // ⏱ FECHAS
  // =========================
  getDiasRestantes(fecha: string): number {
    const hoy = new Date();
    const limite = new Date(fecha);
    const diff = limite.getTime() - hoy.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getAlertClass(fecha: string): string {
    const dias = this.getDiasRestantes(fecha);
    if (dias <= 3) return 'danger';
    if (dias <= 7) return 'warning';
    return 'ok';
  }

  // =========================
  // 💾 ACCIONES
  // =========================
  actualizarPagado(e: any, pagado: boolean) {

    const loader = this.injector.get(LoaderService);
    loader.show();

    this.service.actualizarPagado(e.id, pagado)
      .pipe(finalize(() => loader.hide()))
      .subscribe(() => {
        e.pagado = pagado;
      });
  }

  guardarGasto(card: any) {

    if (this.movimientoForm.invalid) {
      this.movimientoForm.markAllAsTouched();
      return;
    }

    const data = this.movimientoForm.value;
    const loader = this.injector.get(LoaderService);

    loader.show();

    this.service.addMovimiento(data)
      .pipe(finalize(() => loader.hide()))
      .subscribe(() => {

        card.movimientos.push(data);

        this.cerrarPanelGasto();

        this.mostrarNotificacion(
          `✔ Gasto: ${data.descripcion} - $${data.monto}`,
          'info'
        );
      });
  }

  // =========================
  // 🏦 BANCO (CSS CLASS)
  // =========================
  getBancoClass(banco: string): string {
    if (!banco) return 'default';

    banco = banco.toLowerCase();

    if (banco.includes('bbva')) return 'bbva';
    if (banco.includes('santander')) return 'santander';
    if (banco.includes('banorte')) return 'banorte';
    if (banco.includes('hsbc')) return 'hsbc';
    if (banco.includes('inbursa')) return 'inbursa';
    if (banco.includes('plata')) return 'plata';
    if (banco.includes('klar')) return 'klar';
    if (banco.includes('nu')) return 'nu';
    if (banco.includes('rappi')) return 'rappi';
    if (banco.includes('uala')) return 'uala';

    return 'default';
  }

  // =========================
  // 💸 COLOR GASTO
  // =========================
  getColorGasto(card: any): string {
    const gasto = card.gastosMes || 0;

    if (gasto < 2000) return 'bajo';
    if (gasto < 5000) return 'medio';
    return 'alto';
  }

  getProgress(fecha: string): number {
    const dias = this.getDiasRestantes(fecha);
    const ciclo = 30; // suponer ciclo de pago mensual
    return Math.min(Math.max(100 - ((dias / ciclo) * 100), 0), 100);
  }

  // =========================
  // 👁 MOVIMIENTOS
  // =========================
  mostrarPanelMovimiento = false;
  movimientosSeleccionados: any[] = [];

  abrirPanelMovimiento(card: any, event: MouseEvent) {
    event.stopPropagation();

    this.movimientosSeleccionados = card.movimientos || [];
    this.mostrarPanelMovimiento = true;
  }

  cerrarPanelMovimiento() {
    this.mostrarPanelMovimiento = false;
  }
  
  // =========================
  // 📦 PANEL GASTO
  // =========================
  mostrarPanelGasto = false;

  abrirPanelGasto(card: any, event: MouseEvent) {
    event.stopPropagation();

    this.movimientoForm.patchValue({
      estadoCuentaId: card.id
    });

    this.mostrarPanelGasto = true;
  }

  cerrarPanelGasto() {
    this.mostrarPanelGasto = false;
  }

  // =========================
  // ⚠ VALIDACIONES
  // =========================
  esMontoCero(campo: string): boolean {
    const control = this.movimientoForm.get(campo);
    return control?.value === 0;
  }

  // =========================
  // 🔔 NOTIFICACIONES
  // =========================
  mostrarNotificacion(mensaje: string, tipo: 'warning' | 'info') {

    const clase = tipo === 'warning' ? 'snackbar-warning' : 'snackbar-info';

    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      verticalPosition: 'top',
      horizontalPosition: 'center',
      panelClass: [clase]
    });
  }
}