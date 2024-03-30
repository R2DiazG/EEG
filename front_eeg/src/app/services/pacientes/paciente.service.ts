import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PacienteService {
  private apiUrl = 'http://127.0.0.1:5000'; // URL base del API

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

  crearPaciente(idUsuario: number, paciente: any): Observable<any> {
    const url = `${this.apiUrl}/usuarios/${idUsuario}/pacientes`;
    return this.http.post(url, paciente, { headers: this.getHeaders() });
  }

  obtenerPacientesPorUsuario(idUsuario: number): Observable<any[]> {
    const url = `${this.apiUrl}/usuarios/${idUsuario}/pacientes`;
    return this.http.get<any[]>(url, { headers: this.getHeaders() });
  }

  obtenerDetallesPaciente(idPaciente: number): Observable<any> {
    const url = `${this.apiUrl}/pacientes/${idPaciente}/detalles`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  actualizarPacienteDeUsuario(idUsuario: number, idPaciente: number, paciente: any): Observable<any> {
    const url = `${this.apiUrl}/usuarios/${idUsuario}/pacientes/${idPaciente}`;
    return this.http.put(url, paciente, { headers: this.getHeaders() });
  }

  eliminarPaciente(idUsuario: number, idPaciente: number): Observable<any> {
    const url = `${this.apiUrl}/usuarios/${idUsuario}/pacientes/${idPaciente}`;
    return this.http.delete(url, { headers: this.getHeaders() });
  }
}