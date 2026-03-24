import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { EstadoService } from '../../services/estado.service';
import { AsyncPipe, CommonModule, CurrencyPipe, formatDate, NgFor } from '@angular/common';
import { Observable, Subject, switchMap, startWith } from 'rxjs';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-pdf',
  templateUrl: './pdf.component.html',
  styleUrl: './pdf.component.scss',
  imports: [
    NgFor, 
    AsyncPipe, 
    CommonModule, 
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
],
  providers: [CurrencyPipe],
  standalone: true
})

export class PdfComponent 
{

    selectedFile!: File;
    showResult: boolean = true;
    cuentaForm!: FormGroup;

    estado!: Observable<any>;
    estado$!: Observable<any>;
    mostrarFormulario: boolean = false;
  

    constructor(private service: EstadoService, private currencyPipe: CurrencyPipe, private fb: FormBuilder) {
        this.cuentaForm = this.fb.group({
                banco: ['', Validators.required],
                producto: ['', Validators.required],
                tarjeta: ['', [
                    Validators.required,
                    Validators.pattern(/^(\*{12})(\d{4})$/)
                ]],
                clabe: ['', [
                    Validators.required,
                    Validators.pattern('^[A-Z0-9]{10,20}$')
                ]],
                fechaCorte: ['', [
                    Validators.required,
                    Validators.pattern(/^(?!0001-01-01)\d{4}-\d{2}-\d{2}$/)
                ]],
                fechaLimitePago: ['', [
                    Validators.required,
                    Validators.pattern(/^(?!0001-01-01)\d{4}-\d{2}-\d{2}$/)
                ]],
                pagoNoIntereses: ['', Validators.min(0)],
                pagoMinimo: ['', Validators.min(0)],
                saldoTotal: ['', Validators.min(0)],
                limiteCredito: ['', [Validators.required, Validators.min(1)]],
                estadoAlerta: ['Pendiente', Validators.required]
                // movimientos: new FormArray([]),
                // pagado: ''
            });        
    }

    ngOnInit(): void {
        
    }

    private refresh$ = new Subject<void>();

    onFileSelected(event: any) {
        this.selectedFile = event.target.files[0];
    }

    upload() 
    {
        // if (!this.selectedFile) return;
        //     this.service.uploadPdf(this.selectedFile).subscribe(() => {
        //         this.showResult = true;
        //         setTimeout(() => this.showForm(), 300);
        // });
        this.showForm();
    }

    showForm() {
                
        this.estado$ = this.refresh$.pipe(
            startWith(void 0),
            switchMap(() => this.service.uploadPdf(this.selectedFile))
        );

        this.estado$.subscribe(resp => {
                console.log("Respuesta backend:", resp);
                this.cuentaForm.patchValue({
                     banco: [resp.banco],
                    producto: [resp.producto],
                    tarjeta: [resp.tarjeta],
                    clabe: [resp.clabe],
                   fechaCorte: [resp.fechaCorte
                            ? formatDate(resp.fechaCorte, 'yyyy-MM-dd', 'en')
                            : null],

                        fechaLimitePago: [resp.fechaLimitePago
                            ? formatDate(resp.fechaLimitePago, 'yyyy-MM-dd', 'en')
                            : null],
                    pagoNoIntereses: [resp.pagoNoIntereses],
                    pagoMinimo: [resp.pagoMinimo],
                    saldoTotal: [resp.saldoTotal],
                    limiteCredito: [resp.limiteCredito],
                    estadoAlerta: [resp.estadoAlerta]
                    // movimientos: new FormArray([]),
                    // pagado: false
                });
            this.mostrarFormulario = true;
        });
    }

     campoInvalido(campo: string) {
    const control = this.cuentaForm.get(campo);
    return control && control.invalid && control.touched;
  }

//    formData = {
//     banco: '',
//     producto: '',
//     tarjeta: '',
//     clabe: '',
//     fechaCorte: '',
//     fechaLimitePago: '',
//     pagoNoIntereses: '',
//     pagoMinimo: '',
//     saldoTotal: '',
//     limiteCredito: ''
// };

movimientos = [
  { monto: 200, descripcion: 'Supermercado' },
  { monto: 50, descripcion: 'Gasolina' }
];


@Output() panelPrev = new EventEmitter<string>();

  guardar() {
    if (this.cuentaForm.invalid) { console.log('invalid data'); return; }

     this.cuentaForm.addControl('pagado', new FormControl(false));
     //this.cuentaForm.addControl('movimientos', new FormControl([]));

      console.log('guardando...');

      this.cuentaForm.markAllAsTouched();

      const raw = this.cuentaForm.value;

        const payload = Object.keys(raw).reduce((acc, key) => {
        acc[key] = Array.isArray(raw[key]) ? raw[key][0] : raw[key];
        return acc;
        }, {} as any);

        console.log(payload);

        this.service.updateEstado(payload).subscribe({
        next: (res) => {
            console.log('OK', res);
            setTimeout(() => this.mostrarFormulario = false, 300);
        },
        error: (err) => {
            console.log('ERROR COMPLETO:', err);
            console.log('ERROR BACKEND:', err.error);
            console.log('STATUS:', err.status);
        }
        });
        console.log('guardado');

        this.panelPrev.emit('inicio')
  }

  esMontoCero(campo: string): boolean {
    const control = this.cuentaForm.get(campo);
    return control?.value === 0;
    }

    cerrar(){
        // ejemplo simple
        this.mostrarFormulario = false;
    }
}