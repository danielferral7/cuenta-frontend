import { Component, Injector, OnInit } from '@angular/core';
import { EstadoService } from '../../services/estado.service';
import { AsyncPipe, CommonModule, NgFor } from '@angular/common';
import { Observable, Subject, switchMap, startWith, map, tap } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-estados',
  templateUrl: './estado.component.html',
  styleUrl: './estado.component.scss',
  standalone: true,
  imports: [
    NgFor,
    ReactiveFormsModule,
    AsyncPipe,
    CommonModule,
    MatSnackBarModule
  ]
})
export class EstadosComponent implements OnInit {

  estados$!: Observable<any[]>;
  tarjetas$!: Observable<any[]>;

  movimientoForm!: FormGroup;

  totalDeuda = 0;
  totalGastos = 0;
  pagoMinimoTotal = 0;
  pagosProximos = 0;
  tarjetasRiesgo = 0;

  private refresh$ = new Subject<void>();

  constructor(
    private service: EstadoService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private injector: Injector
  ) {
    this.movimientoForm = this.fb.group({
      estadoCuentaId: 0,
      monto: [0, Validators.min(0)],
      descripcion: ['', Validators.required]
    });
  }

  ngOnInit() {

    const loader = this.injector.get(LoaderService);

    this.estados$ = this.refresh$.pipe(
      startWith(void 0),
      switchMap(() => {
        loader.show();
        return this.service.getEstados();
      }),
      map(data =>
        data.map(e => {
          const gastosMes = e.movimientos?.reduce((sum: number, m: any) => sum + m.monto, 0) || 0;
          return {
            ...e,
            saldoTotal: e.saldoTotal + gastosMes,
            gastosMes
          };
        })
      ),
      tap(() => loader.hide())
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
        [...tarjetas].sort((a, b) => {
          const fechaA = new Date(a.fechaCorte);
          const fechaB = new Date(b.fechaCorte);
          return fechaA.getTime() - fechaB.getTime();
        })
      )
    );
  }

  // =========================
  // 📈 METRICAS
  // =========================
  buildMetricas() {
    this.estados$.subscribe(data => {

      this.totalDeuda = 0;
      this.totalGastos = 0;
      this.pagoMinimoTotal = 0;
      this.pagosProximos = 0;
      this.tarjetasRiesgo = 0;

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

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

  getColorGasto(card: any) {
    const gasto = card.gastosMes || 0;

    if (gasto < 2000) return 'bajo';
    if (gasto < 5000) return 'medio';
    return 'alto';
  }

  getBancoClass(banco: string): string {
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
  // ⏱ FECHAS
  // =========================
  getDiasRestantes(fecha: string): number {
    const hoy = new Date();
    const limite = new Date(fecha);
    const diff = limite.getTime() - hoy.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getProgress(fecha: string): number {
    const dias = this.getDiasRestantes(fecha);
    const ciclo = 30;
    return Math.min(Math.max(100 - ((dias / ciclo) * 100), 0), 100);
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

    this.service.actualizarPagado(e.id, pagado).subscribe(() => {
      loader.hide();
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

    this.service.addMovimiento(data).subscribe(() => {

      loader.hide();

      card.movimientos.push(data);

      this.cerrarPanelGasto();

      this.mostrarNotificacion(
        `✔ Gasto: ${data.descripcion} - $${data.monto}`,
        'info'
      );
    });
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

  // =========================
  // ⚠ VALIDACIONES
  // =========================
  esMontoCero(campo: string): boolean {
    const control = this.movimientoForm.get(campo);
    return control?.value === 0;
  }
}