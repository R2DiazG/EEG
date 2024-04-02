import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../login/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://127.0.0.1:5000/usuarios';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
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
    const headers = this.getHeaders();
    return this.http.post(this.apiUrl, usuario, { headers});
  }

  obtenerUsuarios(): Observable<any[]> {
    // Asegúrate de que 'Authorization' se agrega correctamente a los encabezados.
    const access_token = localStorage.getItem('access_token');
    if (!access_token) {
      console.error('Error: Token de autenticación no encontrado.');
      // Aquí podrías manejar el caso de que el token no exista,
      // como redirigir al usuario a la página de inicio de sesión.
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`
    });
    return this.http.get<any[]>(this.apiUrl, { headers });
  }
  
  cambiarAprobacionUsuario(idUsuario: number, aprobacion: boolean): Observable<any> {
    const url = `${this.apiUrl}/${idUsuario}/aprobacion`; // Asegúrate de que apiUrl esté definido correctamente
    const headers = this.getHeaders(); // Asegúrate de que los headers incluyan lo necesario (e.g., Content-Type, Authorization)
    const body = { aprobacion }; // Cuerpo de la solicitud con la nueva aprobación

    // Realiza la solicitud PUT
    return this.http.put(url, body, { headers });
  }

  obtenerUsuario(idUsuario: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${idUsuario}`, { headers: this.getHeaders() });
  }

  actualizarUsuario(idUsuario: number, usuario: any): Observable<any> {
    const url = `${this.apiUrl}/${idUsuario}`; // Asegúrate de que apiUrl esté definido correctamente
    const headers = this.getHeaders(); // Asegúrate de que los headers incluyan lo necesario (e.g., Content-Type, Authorization)

    // Realiza la solicitud PUT
    return this.http.put(url, usuario, { headers });
    //return this.http.put(`${this.apiUrl}/${idUsuario}`, usuario, { headers: this.getHeaders() });
  }

  eliminarUsuario(idUsuario: number): Observable<any> {
    const url = `${this.apiUrl}/${idUsuario}`;
    const headers = this.getHeaders();

    // Realiza la solicitud DELETE
    return this.http.delete(url, { headers });
    //return this.http.delete(`${this.apiUrl}/${idUsuario}`, { headers: this.getHeaders() });
  }
}

