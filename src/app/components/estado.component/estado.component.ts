import { Component, Injectable, OnInit } from '@angular/core';
import { EstadoService } from '../../services/estado.service';
import { AsyncPipe, CommonModule, NgFor } from '@angular/common';
import { Observable, Subject, switchMap, startWith, map } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-estados',
  templateUrl: './estado.component.html',
  styleUrl: './estado.component.scss',
  imports: [NgFor, 
    ReactiveFormsModule,
    AsyncPipe, 
    CommonModule, 
    MatSnackBarModule
  ],
  standalone: true
})

export class EstadosComponent implements OnInit {

  estados$!: Observable<any[]>;
  
  movimientoForm!: FormGroup;

  totalDeuda = 0
  totalGastos = 0
  pagoMinimoTotal = 0
  pagosProximos = 0
  tarjetasRiesgo = 0

  private refresh$ = new Subject<void>();
  tarjetas$!: Observable<any[]>;

  constructor(private service: EstadoService, private snackBar: MatSnackBar, private fb: FormBuilder, private loader: LoaderService) {
     this.movimientoForm = this.fb.group({
                estadoCuentaId: 0,
                monto: ['', Validators.min(0)],
                descripcion: ['', Validators.required]
            });        

  }

  ngOnInit() {
    this.estados$ = this.refresh$.pipe(
      startWith(void 0),
      switchMap(() => this.service.getEstados())
    );

    this.estados$.subscribe(data => {

      this.totalDeuda = 0
      this.totalGastos = 0
      this.pagoMinimoTotal = 0
      this.pagosProximos = 0
      this.tarjetasRiesgo = 0

      const hoy = new Date();
      hoy.setHours(0,0,0,0);

      const pagosHoy: string[] = [];
      const cortesHoy: string[] = [];
      const pagosVencidos: string[] = [];
      const cortesVencidos: string[] = [];

      // this.ordenarTarjetasPorUso();
      this.ordenarTarjetasPorFechaCorte();


      data.forEach(e => {

      const gastosMes = e.movimientos.reduce((sum: number, m: any) => sum + m.monto, 0);
        e.saldoTotal += gastosMes

        this.totalGastos += gastosMes;
        
         if(!e.pagado){

            this.totalDeuda += Number(e.pagoNoIntereses)
            this.pagoMinimoTotal += Number(e.pagoMinimo)
         
            const dias = this.getDiasRestantes(e.fechaLimitePago)

            if(dias <= 7 && dias > 0) this.pagosProximos++

            if(dias <= 1) this.tarjetasRiesgo++

            //Notificaciones
          const fechaLimite = new Date(e.fechaLimitePago);
          const fechaCorte = new Date(e.fechaCorte);

          fechaLimite.setHours(0,0,0,0);
          fechaCorte.setHours(0,0,0,0);

          if (fechaLimite.getTime() === hoy.getTime()) {
              pagosHoy.push(e.banco);
            }

            if (fechaLimite.getTime() <= hoy.getTime()) {
              pagosVencidos.push(e.banco);
            }

            if (fechaCorte.getTime() === hoy.getTime()) {
              cortesHoy.push(e.banco);
            }

            if (fechaCorte.getTime() <= hoy.getTime()) {
              cortesVencidos.push(e.banco);
            }
          }
      })

      if (pagosHoy.length > 0) {
        this.mostrarNotificacion(
          `⚠️ Hoy vence el pago de: ${pagosHoy.join(', ')}`,
          'warning'
        );
      }

      if (pagosVencidos.length > 0) {
        this.mostrarNotificacion(
          `⚠️ Ya pasó la fecha limite de pagos de: ${pagosVencidos.join(', ')}`,
          'warning'
        );
      }

      if (cortesVencidos.length > 0) {
        this.mostrarNotificacion(
          `⚠️ Ya pasó la fecha de corte de: ${cortesVencidos.join(', ')}`,
          'info'
        );
      }
   })

  }

  resumenOpen = false;

  toggleResumen(){
    this.resumenOpen = !this.resumenOpen;
  }

  mostrarNotificacion(mensaje: string, tipo: 'warning' | 'info') {

  const clase = tipo === 'warning' ? 'snackbar-warning' : 'snackbar-info';

  this.snackBar.open(mensaje, 'Cerrar', {
      duration: 6000,
      verticalPosition: 'top',
      horizontalPosition: 'center',
      panelClass: [clase]
    });
  }

  activeCard: any = null;

  toggle(card: any, event: MouseEvent) {

    event.stopPropagation(); // evita cerrar al hacer click dentro

    if (this.activeCard && this.activeCard !== card) {
      this.activeCard.open = false;
    }

    card.open = !card.open;
    this.activeCard = card.open ? card : null;
  }

  toggleDetails(card:any, event:MouseEvent){
    event.stopPropagation();
    card.details = !card.details;
  }

  getDisponible(card:any){
    return card.limiteCredito - card.saldoTotal;
  }

  getUsoCredito(card:any){
     const usado = (card.saldoTotal / card.limiteCredito) * 100;
    //const usado = (94000 / 100000) * 100;

    return `${usado}, 100`;
  }

  closeActive() {
    if (this.activeCard) {
      this.activeCard.open = false;
      this.activeCard = null;
    }
  }

  getPorcentajeUso(card:any){
     if(!card.limiteCredito) return 0;
    const porcentaje = (card.saldoTotal / card.limiteCredito) * 100;
    return Math.round(porcentaje * 100) / 100;
}

ordenarTarjetasPorUso(){
  this.tarjetas$ = this.estados$.pipe(
  map((tarjetas:any[]) => 
    tarjetas.sort((a,b)=>{

      const usoA = this.getPorcentajeUso(a);
      const usoB = this.getPorcentajeUso(b);

      return usoA - usoB;

    })
  )
);
}

ordenarTarjetasPorFechaCorte() {
  this.tarjetas$ = this.estados$.pipe(
    map((tarjetas: any[]) =>
      tarjetas.sort((a, b) => {
        const fechaA = new Date(a.fechaCorte);
        const fechaB = new Date(b.fechaCorte);

        // Orden ascendente: la fecha más próxima primero
        return fechaA.getTime() - fechaB.getTime();
      })
    )
  );
}

getColorUso(card:any){

  const uso = this.getPorcentajeUso(card);

  if(uso < 30) return 'uso-bajo';

  if(uso < 60) return 'uso-medio';

  if(uso < 85) return 'uso-alto';

  return 'uso-riesgo';

}

getColorGasto(card:any){

  const gasto = card.movimientos.reduce((sum: number, m: any) => sum + m.monto, 0);

  if(gasto < 2000) return 'bajo';

  if(gasto < 4000) return 'medio';

  if(gasto > 5000) return 'alto';

  return 'gasto-riesgo';

}

actualizarPagado(e: any, pagado: boolean) {  
    e.pagado = pagado;
     console.log('marcando como pagado...');

        this.service.actualizarPagado(e.id, pagado).subscribe(() => {          
          console.log('guardado');
        });

}


  getDiasRestantes(fecha: string): number {
    const hoy = new Date();
    const limite = new Date(fecha);
    const diff = limite.getTime() - hoy.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getProgress(fecha: string): number {
    const dias = this.getDiasRestantes(fecha);
    const ciclo = 30; // suponer ciclo de pago mensual
    return Math.min(Math.max(100 - ((dias / ciclo) * 100), 0), 100);
  }

  getAlertClass(fecha: string): string {
    const dias = this.getDiasRestantes(fecha);
    if (dias <= 3) return 'danger';
    if (dias <= 7) return 'warning';
    return 'ok';
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

  calcularMetricas() {
    this.totalDeuda = 0;
    this.totalGastos = 0;
    this.pagoMinimoTotal = 0;
    this.pagosProximos = 0;
    this.tarjetasRiesgo = 0;

    this.estados$.forEach(e => {
      this.totalDeuda += Number(e[0].pagoNoIntereses);
      this.pagoMinimoTotal += Number(e[0].pagoMinimo);

      if (e[0].diasRestantes <= 7) this.pagosProximos++;
      if (e[0].diasRestantes <= 3) this.tarjetasRiesgo++;
    });
  }

  remover(card:any, event:MouseEvent){
    event.stopPropagation(); // evita abrir la tarjeta
    // this.service.uploadPdf(this.selectedFile).subscribe(() => {
    //   setTimeout(() => this.refresh$.next(), 300);
    // });
  }

  mostrarPanelGasto = false;

abrirPanelGasto(card: any, event: MouseEvent) {
   event.stopPropagation(); // evita cerrar al hacer click dentro
  this.mostrarPanelGasto = true;

  console.log(card.id);

  this.movimientoForm.patchValue({
                     estadoCuentaId: card.id});
                     
}

cerrarPanelGasto() {
  this.mostrarPanelGasto = false;
  console.log(this.mostrarPanelGasto);
}

guardarGasto(card:any) {

   if (this.movimientoForm.invalid) { console.log('invalid data'); return; }

  this.movimientoForm.markAllAsTouched();
  const data = this.movimientoForm.value;

  console.log(data);
  
  // aquí puedes enviar al backend
  this.service.addMovimiento(data).subscribe(() => {
        setTimeout(() => {
              this.cerrarPanelGasto();
              card.movimientos.push(data);
               this.mostrarNotificacion(
                  `✔ Se registró el gasto: ${data.descripcion} por $${data.monto}`,
                  'info'
                );
              console.log('guardado');
          }, 300);
        });
     
}

 mostrarPanelMovimiento = false;
movimientosSeleccionados:any[] = [];

abrirPanelMovimiento(card: any, event: MouseEvent) {
  console.log("panel movimientos");
   event.stopPropagation(); // evita cerrar al hacer click dentro
this.movimientosSeleccionados = card.movimientos || [];
   this.mostrarPanelMovimiento = true;
console.log(this.mostrarPanelMovimiento);
  console.log(card.id);
                     
}

cerrarPanelMovimiento() {
  this.mostrarPanelMovimiento = false;
}


 esMontoCero(campo: string): boolean {
    const control = this.movimientoForm.get(campo);
    return control?.value === 0;
    }


}