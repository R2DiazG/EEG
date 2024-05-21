import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MedicamentoService {
  private apiUrl = 'http://35.225.46.139:5000/medicamentos';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const access_token = localStorage.getItem('access_token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    if (access_token) {
      headers = headers.set('Authorization', `Bearer ${access_token}`);
    }
    return headers;
  }

  crearMedicamento(medicamento: any): Observable<any> {
    return this.http.post(this.apiUrl, medicamento, { headers: this.getHeaders() });
  }

  obtenerMedicamentos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  obtenerMedicamentoPorId(idMedicamento: number): Observable<any> {
    const url = `${this.apiUrl}/${idMedicamento}`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  obtenerMedicamentosPorPaciente(idPaciente: number): Observable<any[]> {
    const url = `${this.apiUrl}/pacientes/${idPaciente}/medicamentos`;
    return this.http.get<any[]>(url, { headers: this.getHeaders() });
  }

  actualizarMedicamento(idMedicamento: number, medicamento: any): Observable<any> {
    const url = `${this.apiUrl}/${idMedicamento}`;
    return this.http.put(url, medicamento, { headers: this.getHeaders() });
  }

  eliminarMedicamento(idMedicamento: number): Observable<any> {
    const url = `${this.apiUrl}/${idMedicamento}`;
    return this.http.delete(url, { headers: this.getHeaders() });
  }
}
