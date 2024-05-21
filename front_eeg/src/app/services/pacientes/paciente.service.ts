import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { InfoPaciente } from '../../models/info-paciente.model';
import { UpdatePaciente } from '../../models/update-paciente.model';
import { th } from 'date-fns/locale';

@Injectable({
  providedIn: 'root'
})
export class PacienteService {
  private apiUrl = 'http://35.225.46.139:5000'; // URL base del API

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

  crearPaciente(idUsuario: number, formData: FormData): Observable<any> {
    const url = `${this.apiUrl}/usuarios/${idUsuario}/pacientes`;
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(url, formData, { headers });
  }

  obtenerPacientesAgrupadosPorPsicologo(): Observable<any> {
    const url = `${this.apiUrl}/pacientes/por-psicologo`;
    return this.http.get<any>(url, { headers: this.getHeaders() });
  }

  obtenerPacientesPorUsuario(idUsuario: number): Observable<any[]> {
    const url = `${this.apiUrl}/usuarios/${idUsuario}/pacientes`;
    console.log(this.getHeaders());
    return this.http.get<any[]>(url, { headers: this.getHeaders() });
  }

  obtenerDetallesPaciente(idPaciente: number): Observable<InfoPaciente> {
    const url = `${this.apiUrl}/pacientes/${idPaciente}/detalles`;
    return this.http.get<InfoPaciente>(url, { headers: this.getHeaders() });
  }

  actualizarPacienteDeUsuario(idUsuario: number, idPaciente: number, paciente: UpdatePaciente): Observable<UpdatePaciente> {
    const url = `${this.apiUrl}/usuarios/${idUsuario}/pacientes/${idPaciente}`;
    return this.http.put<UpdatePaciente>(url, paciente, { headers: this.getHeaders() });
  }

  eliminarPacienteAdmin(idPaciente: number): Observable<any> {
    const url = `${this.apiUrl}/admin/pacientes/${idPaciente}`;
    return this.http.delete(url, { headers: this.getHeaders() });
  }

  eliminarPaciente(idUsuario: number, idPaciente: number): Observable<any> {
    const url = `${this.apiUrl}/usuarios/${idUsuario}/pacientes/${idPaciente}`;
    return this.http.delete(url, { headers: this.getHeaders() });
  }

  obtenerFechasSesionesPorPaciente(idPaciente: number): Observable<any[]> {
    const url = `${this.apiUrl}/sesiones/pacientes/${idPaciente}/sesiones/fechas`;
    return this.http.get<any[]>(url, { headers: this.getHeaders() });
  }

  obtenerMedicamentosPorPaciente(idPaciente: number): Observable<any[]> {
    const url = `${this.apiUrl}/pacientes/${idPaciente}/medicamentos`;
    return this.http.get<any[]>(url, { headers: this.getHeaders() });
  }

  eliminarSesionPorPaciente(idPaciente: number, idSesion: number): Observable<any> {
    const url = `${this.apiUrl}/pacientes/${idPaciente}/sesiones/${idSesion}`;
    return this.http.delete(url, { headers: this.getHeaders() });
  }

}
