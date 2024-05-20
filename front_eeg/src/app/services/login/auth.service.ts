import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loginUrl = 'http://127.0.0.1:5000/login';
  private forgotPasswordUrl = 'http://127.0.0.1:5000/solicitar_cambio_contraseña';
  private currentUserUrl = 'http://127.0.0.1:5000/usuario/actual';
  private resetPasswordUrl = 'http://127.0.0.1:5000/resetear_contrasena'; // Nueva URL para restablecer contraseña

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<any> {
    return new Observable(observer => {
      this.http.post<any>(this.loginUrl, { username, contraseña: password }).subscribe({
        next: (response) => {
          if (response && response.access_token) {
            localStorage.setItem('access_token', response.access_token);
            observer.next(response);
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
          return response;
        }),
        catchError(error => {
          console.error("Error al obtener el usuario actual:", error);
          return throwError(() => new Error(`Error al obtener el usuario actual: ${error.message}`));
        })        
      );
  }

  resetPassword(token: string, nuevaContrasena: string): Observable<any> {
    return this.http.post<any>(`${this.resetPasswordUrl}/${token}`, { nueva_contrasena: nuevaContrasena })
      .pipe(
        map(response => {
          return response;
        }),
        catchError(error => {
          console.error("Error al resetear la contraseña:", error);
          return throwError(() => new Error(`Error al resetear la contraseña: ${error.message}`));
        })
      );
  }

  logout() {
    localStorage.removeItem('access_token');
  }
}
