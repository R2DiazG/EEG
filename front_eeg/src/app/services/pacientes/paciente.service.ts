import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InfoPaciente } from '../../models/info-paciente.model';
import { UpdatePaciente } from '../../models/update-paciente.model';

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

  crearPaciente(idUsuario: number, pacienteFormData: FormData): Observable<any> {
    const url = `${this.apiUrl}/usuarios/${idUsuario}/pacientes`;
    return this.http.post(url, pacienteFormData, { headers: this.getHeaders() }); // Modificar para soportar FormData
  }

  obtenerPacientesAgrupadosPorPsicologo(): Observable<any> {
    const url = `${this.apiUrl}/pacientes/por-psicologo`;
    return this.http.get<any>(url, { headers: this.getHeaders() });
  }

  obtenerPacientesPorUsuario(idUsuario: number): Observable<any[]> {
    const url = `${this.apiUrl}/usuarios/${idUsuario}/pacientes`;
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
