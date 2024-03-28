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


  // Implement logout and password reset methods here...
}
