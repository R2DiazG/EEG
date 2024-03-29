import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../login/auth.service';


@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://127.0.0.1:5000/usuarios';

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

  crearUsuario(usuario: any): Observable<any> {
    return this.http.post(this.apiUrl, usuario, { headers: this.getHeaders() });
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
    const url = `${this.apiUrl}/${idUsuario}/aprobacion`; // URL específica para cambiar aprobación
    const headers = this.getHeaders(); // Reutiliza el método existente para obtener los encabezados
    const body = { aprobacion }; // Cuerpo de la solicitud con la nueva aprobación

    // Realiza la solicitud PUT
    return this.http.put(url, body, { headers });
  }

  obtenerUsuario(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  actualizarUsuario(id: number, usuario: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, usuario, { headers: this.getHeaders() });
  }

  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
