import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private apiUrl = 'http://127.0.0.1:5000/usuarios';

  constructor(private http: HttpClient) { }

  crearUsuario(usuario: any): Observable<any> {
    return this.http.post(this.apiUrl, usuario);
  }

  obtenerUsuarios(): Observable<any[]> {
    const access_token = localStorage.getItem('access_token'); // Asegúrate de que la clave aquí coincida con cómo guardas el token
    console.log(access_token)
    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + access_token
    });
    return this.http.get<any[]>(this.apiUrl, { headers });
  }
  

  obtenerUsuario(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  actualizarUsuario(id: number, usuario: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, usuario);
  }

  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
