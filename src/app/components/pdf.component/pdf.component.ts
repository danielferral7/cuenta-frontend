import { Component, EventEmitter, Output } from '@angular/core';
import { EstadoService } from '../../services/estado.service';
import { CommonModule, CurrencyPipe, formatDate } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-pdf',
  templateUrl: './pdf.component.html',
  styleUrl: './pdf.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  providers: [CurrencyPipe]
})
export class PdfComponent {

  selectedFile: File | null = null;
  cuentaForm: FormGroup;
  mostrarFormulario = false;

  @Output() panelPrev = new EventEmitter<string>();

  constructor(
    private service: EstadoService,
    private fb: FormBuilder
  ) {

    this.cuentaForm = this.fb.group({
      banco: ['', Validators.required],
      producto: ['', Validators.required],
      tarjeta: ['', [
        Validators.required,
        Validators.pattern(/^(\*{12})(\d{4})$/)
      ]],
      clabe: ['', [
        Validators.required,
        Validators.pattern('^[A-Za-z0-9]{10,20}$')
      ]],
      fechaCorte: ['', Validators.required],
      fechaLimitePago: ['', Validators.required],
      pagoNoIntereses: [0, Validators.min(0)],
      pagoMinimo: [0, Validators.min(0)],
      saldoTotal: [0, Validators.min(0)],
      limiteCredito: [0, [Validators.required, Validators.min(1)]],
      estadoAlerta: ['Pendiente', Validators.required]
    });
  }

  // ===============================
  // 📄 FILE
  // ===============================
  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.selectedFile = file;
  }

  upload() {
    if (!this.selectedFile) {
      console.warn('No hay archivo seleccionado');
      return;
    }

    this.service.uploadPdf(this.selectedFile).subscribe({
      next: (resp) => {
        console.log('Respuesta backend:', resp);
        this.cuentaForm.patchValue({
          banco: resp.banco,
          producto: resp.producto,
          tarjeta: resp.tarjeta,
          clabe: resp.clabe,
          fechaCorte: resp.fechaCorte
            ? formatDate(resp.fechaCorte, 'yyyy-MM-dd', 'en')
            : null,
          fechaLimitePago: resp.fechaLimitePago
            ? formatDate(resp.fechaLimitePago, 'yyyy-MM-dd', 'en')
            : null,
          pagoNoIntereses: resp.pagoNoIntereses ?? 0,
          pagoMinimo: resp.pagoMinimo ?? 0,
          saldoTotal: resp.saldoTotal ?? 0,
          limiteCredito: resp.limiteCredito ?? 0,
          estadoAlerta: resp.estadoAlerta ?? 'Pendiente'
        });

        this.mostrarFormulario = true;
      },
      error: (err) => {
        console.error('Error upload:', err);
      }
    });
  }

  // ===============================
  // 💾 GUARDAR
  // ===============================
  guardar() {

    if (this.cuentaForm.invalid) {
      this.cuentaForm.markAllAsTouched();
      console.warn('Formulario inválido');
      return;
    }

    const payload = {
      ...this.cuentaForm.value,
      pagado: false,
      azureOid: '' // TODO: obtener del token;
    };

    console.log('Payload:', payload);

    this.service.updateEstado(payload).subscribe({
      next: () => {
        console.log('Guardado OK');
        this.mostrarFormulario = false;
        this.panelPrev.emit('inicio');
      },
      error: (err) => {
        console.error('Error guardar:', err);
      }
    });
  }

  // ===============================
  // UI HELPERS
  // ===============================
  campoInvalido(campo: string): boolean {
    const control = this.cuentaForm.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  esMontoCero(campo: string): boolean {
    const value = this.cuentaForm.get(campo)?.value;
    return value === 0;
  }

  cerrar() {
    this.mostrarFormulario = false;
  }
}