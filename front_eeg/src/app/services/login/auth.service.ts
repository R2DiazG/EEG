import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loginUrl = 'http://127.0.0.1:5000/login'; // URL a tu endpoint de login
  private forgotPasswordUrl = 'http://127.0.0.1:5000/solicitar_cambio_contraseña'; // URL a tu endpoint para solicitar cambio de contraseña
  private currentUserUrl = 'http://127.0.0.1:5000/usuario/actual'; // URL a tu endpoint para obtener el usuario actual

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<any> {
    return new Observable(observer => {
      this.http.post<any>(this.loginUrl, { username, contraseña: password }).subscribe({
        next: (response) => {
          if (response && response.access_token) {
            localStorage.setItem('access_token', response.access_token);
            observer.next(response); // Propaga la respuesta a cualquier suscriptor
            observer.complete();
          } else {
            observer.error('No se recibió el token');
          }
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }

  forgotPassword(username: string) {
    return this.http.post<any>(this.forgotPasswordUrl, { username });
  }

  getCurrentUser(): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': 'Bearer ' + localStorage.getItem('access_token')
      })
    };
    return this.http.get<any>(this.currentUserUrl, httpOptions)
      .pipe(
        map(response => {
          // Aquí puedes procesar la respuesta y devolver lo que necesitas
          return response;
        }),
        catchError(error => {
          // Manejo de error
          return throwError(() => new Error('Error al obtener el usuario actual'));
        })
      );
  }

  logout() {
    localStorage.removeItem('access_token'); // Asumiendo que el token se guarda con la clave 'access_token'
    // Aquí deberías invalidar la sesión del lado del servidor si es necesario.
  }
}
