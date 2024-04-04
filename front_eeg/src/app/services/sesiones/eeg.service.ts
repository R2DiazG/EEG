import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse  } from '@angular/common/http';
import { Observable, throwError, timeout, catchError } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EegService {

  private apiUrl = 'http://127.0.0.1:5000/sesiones';


  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const access_token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    if (access_token) {
      headers = headers.set('Authorization', `Bearer ${access_token}`);
    }
    return headers;
  }

  // obtenerEEGPorSesion(idSesion: number): Observable<any> {
  //   const url = `${this.apiUrl}/${idSesion}/eegs`;
  //   return this.http.get(url, { headers: this.getHeaders() });
  // }

  obtenerEEGPorSesion(idSesion: number): Observable<any> {
    const url = `${this.apiUrl}/${idSesion}/eegs`;
  
    return this.http.get(url, { headers: this.getHeaders(), observe: 'response' })
      .pipe(
        catchError((error) => {
          console.error('Error completo:', error);
          if (error instanceof HttpErrorResponse && error.status === 200) {
            // Manejo especial si el status es 200 pero hay un error
            console.error('Error a pesar del status 200:', error.message);
          }
          return throwError(() => new Error('Error al obtener datos de EEG'));
        })
      );
  }
  

  crearNuevaSesion(datosSesion: FormData): Observable<any> {
    // Nota: Usamos FormData para manejar la carga de archivos.
    return this.http.post(`${this.apiUrl}/nueva`, datosSesion, { 
      headers: new HttpHeaders({
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      })
    });
  }

  obtener_paciente_en_base_a_sesion(idSesion: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${idSesion}/paciente`, { headers: this.getHeaders() });
  }

  obtenerSesiones(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  obtenerSesion(idSesion: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${idSesion}`, { headers: this.getHeaders() });
  }

  obtenerUltimaSesion(idPaciente: number): Observable<any> {
    const url = `${this.apiUrl}/pacientes/${idPaciente}/sesiones/fechas`;
    return this.http.get<any[]>(url, { headers: this.getHeaders() })
      .pipe(
        // Suponiendo que el servidor devuelve las sesiones ordenadas por fecha en forma ascendente
        map(sesiones => sesiones.length > 0 ? sesiones[sesiones.length - 1] : undefined)
      );
  }

  actualizarSesion(idSesion: number, datosSesion: any): Observable<any> {
    // Dependiendo de si necesitas subir archivos aquí, puede que necesites usar FormData como en crearNuevaSesion
    const url = `${this.apiUrl}/${idSesion}`;
    return this.http.put(url, datosSesion, { headers: this.getHeaders() });
  }

  eliminarSesion(idSesion: number): Observable<any> {
    const url = `${this.apiUrl}/${idSesion}`;
    return this.http.delete(url, { headers: this.getHeaders() });
  }
  
}
