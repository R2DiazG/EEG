import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private loginUrl = 'http://127.0.0.1:5000/login'; // URL a tu endpoint de login
  private forgotPasswordUrl = 'http://127.0.0.1:5000/solicitar_cambio_contraseña'; // URL a tu endpoint para solicitar cambio de contraseña

  constructor(private http: HttpClient) { }

  login(username: string, password: string) {
    return this.http.post<any>(this.loginUrl, { username, contraseña: password });
  }

  forgotPassword(username: string) {
    return this.http.post<any>(this.forgotPasswordUrl, { username });
  }

  logout() {
    // Aquí deberías invalidar la sesión del lado del servidor.
    // Por ejemplo, si estás usando tokens JWT, borra el token del almacenamiento local o de las cookies.
    localStorage.removeItem('access_token'); // Asumiendo que el token se guarda con la clave 'access_token'
    // Luego puedes informar al servidor para que invalide el token si es necesario
    // return this.http.post('/api/logout', {});
  }

  // Implement logout and password reset methods here...
}