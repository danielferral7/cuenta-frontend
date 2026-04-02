import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EstadoCuenta } from '../models/estado-cuenta';

@Injectable({ providedIn: 'root' })
export class EstadoService {
  actualizarPagado(id: any, pagado: boolean) {
    console.log(`${this.apiUrl}/estados/marcarPagado/${id}/pagado`)
    return this.http.put(`${this.apiUrl}/estados/marcarPagado/${id}/pagado`, pagado);
  }
  
  addMovimiento(formData: FormData) {
    console.log('agregando movimiento'); 
      return this.http.post(`${this.apiUrl}/estados/addMovimiento`, formData);
  }

  apiUrl = 'https://cuentaapi20260322155911-gxcxhfatbuffgsdk.centralus-01.azurewebsites.net/api';  

  updateEstado(payload: any) {        
    console.log('actualizando estado'); 
      return this.http.post(`${this.apiUrl}/estados/updateEstado`, payload);
    }

  constructor(private http: HttpClient) {}

  getEstados() {
    return this.http.get<any[]>(`${this.apiUrl}/estados`);
  }

  uploadPdf(file: File): Observable<EstadoCuenta> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<EstadoCuenta>(`${this.apiUrl}/pdf/procesar`, formData);

  }
}