import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://127.0.0.1:5000/usuarios';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object  // Inyectar PLATFORM_ID para verificar el entorno de ejecución
  ) { }

  private getHeaders(): HttpHeaders {
    // Inicializar headers sin Authorization
    let headers = new HttpHeaders({ 'Content-Type': 'application/json', });

    // Verificar si se está en el lado del cliente
    if (isPlatformBrowser(this.platformId)) {
      const access_token = localStorage.getItem('access_token');
      if (access_token) {
        // Agregar Authorization solo si se está en el cliente y el token existe
        headers = headers.set('Authorization', `Bearer ${access_token}`);
      }
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

