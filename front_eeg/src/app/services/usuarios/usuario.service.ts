import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://localhost:4200/usuarios';

  constructor(
    private http: HttpClient
  ) { }

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

  crearUsuario(usuario: any): Observable<any> {
    return this.http.post(this.apiUrl, usuario, { headers: this.getHeaders() });
  }

  obtenerUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }
  
  cambiarAprobacionUsuario(idUsuario: number, aprobacion: boolean): Observable<any> {
    const url = `${this.apiUrl}/${idUsuario}/aprobacion`;
    const body = { aprobacion };
    return this.http.put(url, body, { headers: this.getHeaders() });
  }

  obtenerUsuario(idUsuario: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${idUsuario}`, { headers: this.getHeaders() });
  }

  actualizarUsuario(idUsuario: number, usuario: any): Observable<any> {
    const url = `${this.apiUrl}/${idUsuario}`;
    return this.http.put(url, usuario, { headers: this.getHeaders() });
  }

  eliminarUsuario(idUsuario: number): Observable<any> {
    const url = `${this.apiUrl}/${idUsuario}`;
    return this.http.delete(url, { headers: this.getHeaders() });
  }
}

